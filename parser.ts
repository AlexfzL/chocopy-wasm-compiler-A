import {parser} from "lezer-python";
import { TreeCursor} from "lezer-tree";
import { Program, Expr, Stmt, UniOp, BinOp, Parameter, Type, FunDef, VarInit, Class, Literal, TypeVar } from "./ast";
import { NUM, BOOL, NONE, CLASS } from "./utils";
import { stringifyTree } from "./treeprinter";

export function traverseLiteral(c : TreeCursor, s : string) : Literal {
  switch(c.type.name) {
    case "Number":
      return {
        tag: "num",
        value: Number(s.substring(c.from, c.to))
      }
    case "Boolean":
      return {
        tag: "bool",
        value: s.substring(c.from, c.to) === "True"
      }
    case "None":
      return {
        tag: "none"
      }
    case "VariableName":
      let vname = s.substring(c.from, c.to).trim();
      if (vname !== "__ZERO__") {
        throw new Error("ParseError: Not a literal");
      }
      return { 
        tag: "zero" 
      };
    default:
      throw new Error("Not literal")
  }
}

export function traverseExpr(c : TreeCursor, s : string) : Expr<null> {
  switch(c.type.name) {
    case "Number":
    case "Boolean":
    case "None":
      return { 
        tag: "literal", 
        value: traverseLiteral(c, s)
      }      
    case "VariableName":
      return {
        tag: "id",
        name: s.substring(c.from, c.to)
      }
    case "CallExpression":
      c.firstChild();
      const callExpr = traverseExpr(c, s);
      c.nextSibling(); // go to arglist
      let args = traverseArguments(c, s);
      c.parent(); // pop CallExpression


      if (callExpr.tag === "lookup") {
        return {
          tag: "method-call",
          obj: callExpr.obj,
          method: callExpr.field,
          arguments: args
        }
      } else if (callExpr.tag === "id") {
        const callName = callExpr.name;
        var expr : Expr<null>;
        if (callName === "print" || callName === "abs") {
          expr = {
            tag: "builtin1",
            name: callName,
            arg: args[0]
          };
        } else if (callName === "max" || callName === "min" || callName === "pow") {
          expr = {
            tag: "builtin2",
            name: callName,
            left: args[0],
            right: args[1]
          }
        }
        else {
          expr = { tag: "call", name: callName, arguments: args};
        }
        return expr;  
      } else {
        throw new Error("Unknown target while parsing assignment");
      }

    case "BinaryExpression":
      c.firstChild(); // go to lhs 
      const lhsExpr = traverseExpr(c, s);
      c.nextSibling(); // go to op
      var opStr = s.substring(c.from, c.to);
      var op;
      switch(opStr) {
        case "+":
          op = BinOp.Plus;
          break;
        case "-":
          op = BinOp.Minus;
          break;
        case "*":
          op = BinOp.Mul;
          break;
        case "//":
          op = BinOp.IDiv;
          break;
        case "%":
          op = BinOp.Mod;
          break
        case "==":
          op = BinOp.Eq;
          break;
        case "!=":
          op = BinOp.Neq;
          break;
        case "<=":
          op = BinOp.Lte;
          break;
        case ">=":
          op = BinOp.Gte;
          break;
        case "<":
          op = BinOp.Lt;
          break;
        case ">":
          op = BinOp.Gt;
          break;
        case "is":
          op = BinOp.Is;
          break; 
        case "and":
          op = BinOp.And;
          break;
        case "or":
          op = BinOp.Or;
          break;
        default:
          throw new Error("Could not parse op at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to))
      }
      c.nextSibling(); // go to rhs
      const rhsExpr = traverseExpr(c, s);
      c.parent();
      return {
        tag: "binop",
        op: op,
        left: lhsExpr,
        right: rhsExpr
      }
    case "ParenthesizedExpression":
      c.firstChild(); // Focus on (
      c.nextSibling(); // Focus on inside
      var expr = traverseExpr(c, s);
      c.parent();
      return expr;
    case "UnaryExpression":
      c.firstChild(); // Focus on op
      var opStr = s.substring(c.from, c.to);
      var op;
      switch(opStr) {
        case "-":
          op = UniOp.Neg;
          break;
        case "not":
          op = UniOp.Not;
          break;
        default:
          throw new Error("Could not parse op at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to))
      }
      c.nextSibling(); // go to expr
      var expr = traverseExpr(c, s);
      c.parent();
      return {
        tag: "uniop",
        op: op,
        expr: expr
      }
    case "MemberExpression":
      c.firstChild(); // Focus on object
      var objExpr = traverseExpr(c, s);
      c.nextSibling(); // Focus on .
      c.nextSibling(); // Focus on property
      var propName = s.substring(c.from, c.to);
      c.parent();
      return {
        tag: "lookup",
        obj: objExpr,
        field: propName
      }
    case "self":
      return {
        tag: "id",
        name: "self"
      };
    default:
      throw new Error("Could not parse expr at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to));
  }
}

export function traverseArguments(c : TreeCursor, s : string) : Array<Expr<null>> {
  c.firstChild();  // Focuses on open paren
  const args = [];
  c.nextSibling();
  while(c.type.name !== ")") {
    let expr = traverseExpr(c, s);
    args.push(expr);
    c.nextSibling(); // Focuses on either "," or ")"
    c.nextSibling(); // Focuses on a VariableName
  } 
  c.parent();       // Pop to ArgList
  return args;
}

export function traverseStmt(c : TreeCursor, s : string) : Stmt<null> {
  switch(c.node.type.name) {
    case "ReturnStatement":
      c.firstChild();  // Focus return keyword
      
      var value : Expr<null>;
      if (c.nextSibling()) // Focus expression
        value = traverseExpr(c, s);
      else
        value = { tag: "literal", value: { tag: "none" } };
      c.parent();
      return { tag: "return", value };
    case "AssignStatement":
      c.firstChild(); // go to name
      const target = traverseExpr(c, s);
      c.nextSibling(); // go to equals
      c.nextSibling(); // go to value
      var value = traverseExpr(c, s);
      c.parent();

      if (target.tag === "lookup") {
        return {
          tag: "field-assign",
          obj: target.obj,
          field: target.field,
          value: value
        }
      } else if (target.tag === "id") {
        return {
          tag: "assign",
          name: target.name,
          value: value
        }  
      } else {
        throw new Error("Unknown target while parsing assignment");
      }
    case "ExpressionStatement":
      c.firstChild();
      const expr = traverseExpr(c, s);
      c.parent(); // pop going into stmt
      return { tag: "expr", expr: expr }
    // case "FunctionDefinition":
    //   c.firstChild();  // Focus on def
    //   c.nextSibling(); // Focus on name of function
    //   var name = s.substring(c.from, c.to);
    //   c.nextSibling(); // Focus on ParamList
    //   var parameters = traverseParameters(c, s)
    //   c.nextSibling(); // Focus on Body or TypeDef
    //   let ret : Type = NONE;
    //   if(c.type.name === "TypeDef") {
    //     c.firstChild();
    //     ret = traverseType(c, s);
    //     c.parent();
    //   }
    //   c.firstChild();  // Focus on :
    //   var body = [];
    //   while(c.nextSibling()) {
    //     body.push(traverseStmt(c, s));
    //   }
      // console.log("Before pop to body: ", c.type.name);
    //   c.parent();      // Pop to Body
      // console.log("Before pop to def: ", c.type.name);
    //   c.parent();      // Pop to FunctionDefinition
    //   return {
    //     tag: "fun",
    //     name, parameters, body, ret
    //   }
    case "IfStatement":
      c.firstChild(); // Focus on if
      c.nextSibling(); // Focus on cond
      var cond = traverseExpr(c, s);
      // console.log("Cond:", cond);
      c.nextSibling(); // Focus on : thn
      c.firstChild(); // Focus on :
      var thn = [];
      while(c.nextSibling()) {  // Focus on thn stmts
        thn.push(traverseStmt(c,s));
      }
      // console.log("Thn:", thn);
      c.parent();
      
      c.nextSibling(); // Focus on else
      c.nextSibling(); // Focus on : els
      c.firstChild(); // Focus on :
      var els = [];
      while(c.nextSibling()) { // Focus on els stmts
        els.push(traverseStmt(c, s));
      }
      c.parent();
      c.parent();
      return {
        tag: "if",
        cond: cond,
        thn: thn,
        els: els
      }
    case "WhileStatement":
      c.firstChild(); // Focus on while
      c.nextSibling(); // Focus on condition
      var cond = traverseExpr(c, s);
      c.nextSibling(); // Focus on body

      var body = [];
      c.firstChild(); // Focus on :
      while(c.nextSibling()) {
        body.push(traverseStmt(c, s));
      }
      c.parent(); 
      c.parent();
      return {
        tag: "while",
        cond,
        body
      }
    case "PassStatement":
      return { tag: "pass" }
    default:
      throw new Error("Could not parse stmt at " + c.node.from + " " + c.node.to + ": " + s.substring(c.from, c.to));
  }
}

export function traverseType(c : TreeCursor, s : string) : Type {
  switch (c.type.name) {
    case "VariableName":
      let name = s.substring(c.from, c.to);
      switch(name) {
        case "int": return NUM;
        case "bool": return BOOL;
        default: return CLASS(name, []);
      }
    case "MemberExpression":
      c.firstChild(); // focus on class
      let cname = s.substring(c.from, c.to).trim();
      c.nextSibling(); // focus on [
      c.nextSibling(); // focus on VariableName or ]
      const params : Array<Type> = [];
      while (c.type.name as any !== "]") {
        params.push(traverseType(c, s));
        c.nextSibling(); // focus on , or ]
        c.nextSibling(); // focus on VariableName or ]
      }
      c.parent();
      return { tag: "class", name: cname, params }
    default:
      throw new Error("ParseError : Could not parse type");
  }
}

export function traverseParameters(c : TreeCursor, s : string) : Array<Parameter<null>> {
  c.firstChild();  // Focuses on open paren
  const parameters = [];
  c.nextSibling(); // Focuses on a VariableName
  while(c.type.name !== ")") {
    let name = s.substring(c.from, c.to);
    c.nextSibling(); // Focuses on "TypeDef", hopefully, or "," if mistake
    let nextTagName = c.type.name; // NOTE(joe): a bit of a hack so the next line doesn't if-split
    if(nextTagName !== "TypeDef") { throw new Error("Missed type annotation for parameter " + name)};
    c.firstChild();  // Enter TypeDef
    c.nextSibling(); // Focuses on type itself
    let typ = traverseType(c, s);
    c.parent();
    c.nextSibling(); // Move on to comma or ")"
    parameters.push({name, type: typ});
    c.nextSibling(); // Focuses on a VariableName
  }
  c.parent();       // Pop to ParamList
  return parameters;
}

export function traverseVarInit(c : TreeCursor, s : string) : VarInit<null> {
  c.firstChild(); // go to name
  var name = s.substring(c.from, c.to);
  c.nextSibling(); // go to : type

  if(c.type.name !== "TypeDef") {
    c.parent();
    throw Error("invalid variable init");
  }
  c.firstChild(); // go to :
  c.nextSibling(); // go to type
  const type = traverseType(c, s);
  c.parent();
  
  c.nextSibling(); // go to =
  c.nextSibling(); // go to value
  var value = traverseLiteral(c, s);
  c.parent();

  return { name, type, value }
}

export function traverseTypeVarInit(c : TreeCursor, s : string) : TypeVar<null> {
  c.firstChild(); // focus on type var name
  var name = s.substring(c.from, c.to).trim();
  c.nextSibling(); // focus on AssignOp
  c.nextSibling(); // focus on CallExpression

  c.firstChild(); // focus on TypeVar
  c.nextSibling(); // focus on ArgList

  c.firstChild();  // Focuses on open parens
  c.nextSibling(); // Focuses on a String | close parens
  let canonicalName : string = name;
  if (c.type.name === "String") {
    canonicalName = s.substring(c.from + 1, c.to - 1).trim();
    c.nextSibling(); // Focus on or close parens
  }

  if (c.type.name !== ")") {
    throw Error("ParseError : constrained type variables are not supported.");
  }

  c.parent(); // go to ArgList
  c.parent(); // go to CallExpression
  c.parent(); // go to AssigmentStatement

  // TODO : Need to delete this once we have removed types from AST
  const types : Array<Type> = [];
  return { name, canonicalName, types};
}

export function traverseFunDef(c : TreeCursor, s : string) : FunDef<null> {
  c.firstChild();  // Focus on def
  c.nextSibling(); // Focus on name of function
  var name = s.substring(c.from, c.to);
  c.nextSibling(); // Focus on ParamList
  var parameters = traverseParameters(c, s)
  c.nextSibling(); // Focus on Body or TypeDef
  let ret : Type = NONE;
  if(c.type.name === "TypeDef") {
    c.firstChild();
    ret = traverseType(c, s);
    c.parent();
    c.nextSibling();
  }
  c.firstChild();  // Focus on :
  var inits = [];
  var body = [];
  
  var hasChild = c.nextSibling();

  while(hasChild) {
    if (isVarInit(c, s)) {
      inits.push(traverseVarInit(c, s));
    } else {
      break;
    }
    hasChild = c.nextSibling();
  }

  while(hasChild) {
    body.push(traverseStmt(c, s));
    hasChild = c.nextSibling();
  } 
  
  // console.log("Before pop to body: ", c.type.name);
  c.parent();      // Pop to Body
  // console.log("Before pop to def: ", c.type.name);
  c.parent();      // Pop to FunctionDefinition
  return { name, parameters, ret, inits, body }
}

export function traverseGenericParams(c : TreeCursor, s : string) : Array<string> {
  const typeParams : Array<string> = [];
  if (c.type.name !== "ArgList") {
    return typeParams;
  }

  c.firstChild(); // Focus on (
  c.nextSibling(); // Focus on first argument
  let arg1C = c; 
  if (arg1C.type.name !== "MemberExpression") {
    c.parent();
    return typeParams;
  }

  c.firstChild();
  if (s.substring(c.from, c.to).trim() !== "Generic") {
    c.parent();
    c.parent();
    return typeParams;
  }

  c.nextSibling(); // Focus on [
  c.nextSibling(); // Focus on VariableName or ]
  let typeVarC = c;
  while (typeVarC.type.name !== "]") {
    typeParams.push(s.substring(typeVarC.from, typeVarC.to).trim());
    typeVarC.nextSibling(); // Focus on , or ]
    typeVarC.nextSibling(); // Focus on VariableName
  }

  c.parent(); // / Go back to MemberExpression
  c.parent(); // Go back to ArgList

  return typeParams;
}

export function traverseClass(c : TreeCursor, s : string) : Class<null> {
  const fields : Array<VarInit<null>> = [];
  const methods : Array<FunDef<null>> = [];
  
  c.firstChild();
  c.nextSibling(); // Focus on class name
  const className = s.substring(c.from, c.to);
  c.nextSibling(); // Focus on arglist/superclass/generic type vars(s)

  const typeParams : Array<string> = traverseGenericParams(c, s);

  c.nextSibling(); // Focus on body
  c.firstChild();  // Focus colon
  while(c.nextSibling()) { // Focuses first field
    if (isVarInit(c, s)) {
      fields.push(traverseVarInit(c, s));
    } else if (isFunDef(c, s)) {
      methods.push(traverseFunDef(c, s));
    } else {
      throw new Error(`Could not parse the body of class: ${className}` );
    }
  }
  c.parent();
  c.parent();

  if (!methods.find(method => method.name === "__init__")) {
    const typeVars : Type[] = typeParams.map(tp => {
      return CLASS(tp);
    })
    methods.push({ name: "__init__", parameters: [{ name: "self", type: CLASS(className, typeVars) }], ret: NONE, inits: [], body: [] });
  }
  return {
    name: className,
    typeParams,
    fields,
    methods
  };
}

export function traverseDefs(c : TreeCursor, s : string) : [Array<VarInit<null>>, Array<FunDef<null>>, Array<Class<null>>] {
  const inits : Array<VarInit<null>> = [];
  const funs : Array<FunDef<null>> = [];
  const classes : Array<Class<null>> = [];

  while(true) {
    if (isVarInit(c, s)) {
      inits.push(traverseVarInit(c, s));
    } else if (isFunDef(c, s)) {
      funs.push(traverseFunDef(c, s));
    } else if (isClassDef(c, s)) {
      classes.push(traverseClass(c, s));
    } else {
      return [inits, funs, classes];
    }
    c.nextSibling();
  }

}

export function isVarInit(c : TreeCursor, s : string) : Boolean {
  if (c.type.name === "AssignStatement") {
    c.firstChild(); // Focus on lhs
    c.nextSibling(); // go to : type

    const isVar = c.type.name as any === "TypeDef";
    c.parent();
    return isVar;  
  } else {
    return false;
  }
}

export function isTypeVarInit(c : TreeCursor, s : string) : Boolean {
  if (c.type.name === "AssignStatement") {
    c.firstChild(); // Focus on lhs
    c.nextSibling(); // go to AssignOp
    c.nextSibling(); // go to CallExpression

    if (c.type.name as any !== "CallExpression") {
      c.parent();
      return false;
    }

    c.firstChild(); // Focus on TypeVar
    if (c.type.name as any !== "VariableName" || s.substring(c.from, c.to).trim() !== "TypeVar") {
      c.parent();
      c.parent();
      return false;
    }

    c.parent();
    c.parent();
    return true;  
  } else {
    return false;
  }
}

export function isFunDef(c : TreeCursor, s : string) : Boolean {
  return c.type.name === "FunctionDefinition";
}

export function isClassDef(c : TreeCursor, s : string) : Boolean {
  return c.type.name === "ClassDefinition";
}

export function traverse(c : TreeCursor, s : string) : Program<null> {
  switch(c.node.type.name) {
    case "Script":
      const inits : Array<VarInit<null>> = [];
      const funs : Array<FunDef<null>> = [];
      const classes : Array<Class<null>> = [];
      const stmts : Array<Stmt<null>> = [];
      const typeVarInits : Array<TypeVar<null>> = [];
      var hasChild = c.firstChild();

      while(hasChild) {
        if (isVarInit(c, s)) {
          inits.push(traverseVarInit(c, s));
        } else if (isTypeVarInit(c, s)) {
          typeVarInits.push(traverseTypeVarInit(c, s));
        } else if (isFunDef(c, s)) {
          funs.push(traverseFunDef(c, s));
        } else if (isClassDef(c, s)) {
          classes.push(traverseClass(c, s));
        } else {
          break;
        }
        hasChild = c.nextSibling();
      }

      while(hasChild) {
        stmts.push(traverseStmt(c, s));
        hasChild = c.nextSibling();
      } 
      c.parent();
      return { funs, inits, typeVarInits, classes, stmts };
    default:
      throw new Error("Could not parse program at " + c.node.from + " " + c.node.to);
  }
}

export function parse(source : string) : Program<null> {
  const t = parser.parse(source);
  const str = stringifyTree(t.cursor(), source, 0);
  console.log(str);
  return traverse(t.cursor(), source);
}
