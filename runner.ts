// This is a mashup of tutorials from:
//
// - https://github.com/AssemblyScript/wabt.js/
// - https://developer.mozilla.org/en-US/docs/WebAssembly/Using_the_JavaScript_API

import wabt from 'wabt';
import { compile, GlobalEnv } from './compiler';
import {parse} from './parser';
import {emptyLocalTypeEnv, GlobalTypeEnv, tc, tcStmt} from  './type-check';
import { Annotation, Program, Type, Value } from './ast';
import { PyValue, NONE, BOOL, NUM, CLASS } from "./utils";
import { lowerProgram } from './lower';
import { optimizeProgram } from './optimization';
import { wasmErrorImports } from './errors';

export type Config = {
  importObject: any;
  // env: compiler.GlobalEnv,
  env: GlobalEnv,
  typeEnv: GlobalTypeEnv,
  functions: string        // prelude functions
}

// NOTE(joe): This is a hack to get the CLI Repl to run. WABT registers a global
// uncaught exn handler, and this is not allowed when running the REPL
// (https://nodejs.org/api/repl.html#repl_global_uncaught_exceptions). No reason
// is given for this in the docs page, and I haven't spent time on the domain
// module to figure out what's going on here. It doesn't seem critical for WABT
// to have this support, so we patch it away.
if(typeof process !== "undefined") {
  const oldProcessOn = process.on;
  process.on = (...args : any) : any => {
    if(args[0] === "uncaughtException") { return; }
    else { return oldProcessOn.apply(process, args); }
  };
}

export async function runWat(source : string, importObject : any) : Promise<any> {
  const wabtInterface = await wabt();
  const myModule = wabtInterface.parseWat("test.wat", source);
  var asBinary = myModule.toBinary({});
  var wasmModule = await WebAssembly.instantiate(asBinary.buffer, importObject);
  const result = (wasmModule.instance.exports.exported_func as any)();
  return [result, wasmModule];
}


export function augmentEnv(env: GlobalEnv, prog: Program<Annotation>) : GlobalEnv {
  const newGlobals = new Map(env.globals);
  const newClasses = new Map(env.classes);

  var newOffset = env.offset;
  prog.inits.forEach((v) => {
    newGlobals.set(v.name, true);
  });
  prog.classes.forEach(cls => {
    const classFields = new Map();
    cls.fields.forEach((field, i) => classFields.set(field.name, [i, field.value]));
    newClasses.set(cls.name, classFields);
  });
  return {
    globals: newGlobals,
    classes: newClasses,
    locals: env.locals,
    labels: env.labels,
    offset: newOffset
  }
}


// export async function run(source : string, config: Config) : Promise<[Value, compiler.GlobalEnv, GlobalTypeEnv, string]> {
export async function run(source : string, config: Config) : Promise<[Value<Annotation>, GlobalEnv, GlobalTypeEnv, string, WebAssembly.WebAssemblyInstantiatedSource]> {
  config.importObject.errors.src = source; // for error reporting
  const parsed = parse(source);
  const [tprogram, tenv] = tc(config.typeEnv, parsed);
  const globalEnv = augmentEnv(config.env, tprogram);
  const irprogram = lowerProgram(tprogram, globalEnv);
  const optIr = optimizeProgram(irprogram);
  const progTyp = tprogram.a.type;
  var returnType = "";
  var returnExpr = "";
  // const lastExpr = parsed.stmts[parsed.stmts.length - 1]
  // const lastExprTyp = lastExpr.a;
  // console.log("LASTEXPR", lastExpr);
  if(progTyp !== NONE) {
    returnType = "(result i32)";
    returnExpr = "(local.get $$last)"
  } 
  let globalsBefore = config.env.globals;
  // const compiled = compiler.compile(tprogram, config.env);
  const compiled = compile(optIr, globalEnv);

  const globalImports = [...globalsBefore.keys()].map(name =>
    `(import "env" "${name}" (global $${name} (mut i32)))`
  ).join("\n");
  const globalDecls = compiled.globals.map(name =>
    `(global $${name} (export "${name}") (mut i32) (i32.const 0))`
  ).join("\n");

  const importObject = config.importObject;
  if(!importObject.js) {
    const memory = new WebAssembly.Memory({initial:2000, maximum:2000});
    importObject.js = { memory: memory };
  }

  const wasmSource = `(module
    (import "js" "memory" (memory 1))
    ${wasmErrorImports}
    (func $print_num (import "imports" "print_num") (param i32) (result i32))
    (func $print_bool (import "imports" "print_bool") (param i32) (result i32))
    (func $print_none (import "imports" "print_none") (param i32) (result i32))
    (func $abs (import "imports" "abs") (param i32) (result i32))
    (func $min (import "imports" "min") (param i32) (param i32) (result i32))
    (func $max (import "imports" "max") (param i32) (param i32) (result i32))
    (func $pow (import "imports" "pow") (param i32) (param i32) (result i32))
    (func $alloc (import "libmemory" "alloc") (param i32) (result i32))
    (func $load (import "libmemory" "load") (param i32) (param i32) (result i32))
    (func $store (import "libmemory" "store") (param i32) (param i32) (param i32))
    (func $$add (import "imports" "$add") (param i32) (param i32) (result i32))
    (func $$sub (import "imports" "$sub") (param i32) (param i32) (result i32))
    (func $$mul (import "imports" "$mul") (param i32) (param i32) (result i32))
    (func $$div (import "imports" "$div") (param i32) (param i32) (result i32))
    (func $$mod (import "imports" "$mod") (param i32) (param i32) (result i32))
    (func $$eq (import "imports" "$eq") (param i32) (param i32) (result i32))
    (func $$neq (import "imports" "$neq") (param i32) (param i32) (result i32))
    (func $$lte (import "imports" "$lte") (param i32) (param i32) (result i32))
    (func $$gte (import "imports" "$gte") (param i32) (param i32) (result i32))
    (func $$lt (import "imports" "$lt") (param i32) (param i32) (result i32))
    (func $$gt (import "imports" "$gt") (param i32) (param i32) (result i32))
    ${globalImports}
    ${globalDecls}
    ${config.functions}
    ${compiled.functions}
    (func (export "exported_func") ${returnType}
      ${compiled.mainSource}
      ${returnExpr}
    )
  )`;
  // console.log(wasmSource);
  const [result, instance] = await runWat(wasmSource, importObject);

  return [PyValue(progTyp, result), compiled.newEnv, tenv, compiled.functions, instance];
}
