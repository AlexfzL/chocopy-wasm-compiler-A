import { assertPrint, assertFail, assertTCFail, assertTC, assertOptimize, assertOptimizeIR } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("Optimizations tests", () => {
    assertOptimizeIR(
        "IR-simple-constant-folding", 
        `
        a: int = 0
        a = 1*2+3--4
        `,
        {
            "funs": [],
            "inits": [
              {
                "name": "valname1",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "name": "valname2",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "name": "valname3",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "name": "a",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 0n
                },
              }
            ],
            "classes": [],
            "body": [
              {
                "label": "$startProg1",
                "stmts": [
                  {
                    "tag": "assign",
                    "name": "valname1",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 2n
                      }
                    }
                  },
                  {
                    "tag": "assign",
                    "name": "valname2",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 5n
                      }
                    }
                  },
                  {
                    "tag": "assign",
                    "name": "valname3",
                    "value": {
                      "tag": "value",
                      "value": {
                       "tag": "num",
                       "value": -4n
                      }
                    }
                  },
                  {
                    "tag": "assign",
                    "name": "a",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 9n
                      }
                    }
                  }
                ]
              }
            ]
          }
    );
    
    assertOptimizeIR(
        "IR-if-else-propagate", 
        `
        a: int = 15
        b:int = 0
        if(10 > 11):
            a = 15
        b = a + 5
        `,
        {
            "funs": [],
            "inits": [
              {
                "name": "valname4",
                "type": {
                  "tag": "bool"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "name": "a",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 15n
                },
              },
              {
                "name": "b",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 0n
                },
              }
            ],
            "classes": [],
            "body": [
              {
                "label": "$startProg2",
                "stmts": [
                  {
                    "tag": "assign",
                    "name": "valname4",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag": "bool",
                        "value": false
                      }
                    }
                  },
                  {
                    "tag": "ifjmp",
                    "cond": {
                        "tag": "bool",
                        "value": false
                    },
                    "thn": "$then1",
                    "els": "$else1"
                  }
                ]
              },
              {
                "label": "$then1",
                "stmts": [
                  {
                    "tag": "assign",
                    "name": "a",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 15n
                      }
                    }
                  },
                  {
                    "tag": "jmp",
                    "lbl": "$end1"
                  }
                ]
              },
              {
                "label": "$else1",
                "stmts": [
                  {
                    "tag": "jmp",
                    "lbl": "$end1"
                  }
                ]
              },
              {
                "label": "$end1",
                "stmts": [
                  {
                    "tag": "assign",
                    "name": "b",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 20n
                      }
                    }
                  }
                ]
              }
            ]
          }
    );

    assertOptimizeIR(
        "IR-if-else-notpropagate", 
        `
        a: int = 16
        b:int = 0
        if(10 > 11):
            a = 15
        b = a + 5
        `,
        {
            "funs": [],
            "inits": [
              {
                "name": "valname5",
                "type": {
                  "tag": "bool"
                },
                "value": {
                  "tag": "none"
                }
              },
              {
                "name": "a",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 16n
                },
              },
              {
                "name": "b",
                "type": {
                  "tag": "number"
                },
                "value": {
                  "tag": "num",
                  "value": 0n
                },
              }
            ],
            "classes": [],
            "body": [
              {
                "label": "$startProg3",
                "stmts": [
                  {
                    "tag": "assign",
                    "name": "valname5",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag":"bool",
                        "value":false
                      }
                    }
                  },
                  {
                    "tag": "ifjmp",
                    "cond": {
                      "tag": "bool",
                      "value": false,
                    },
                    "thn": "$then2",
                    "els": "$else2"
                  }
                ]
              },
              {
                "label": "$then2",
                "stmts": [
                  {
                    "tag": "assign",
                    "name": "a",
                    "value": {
                      "tag": "value",
                      "value": {
                        "tag": "num",
                        "value": 15n
                      }
                    }
                  },
                  {
                    "tag": "jmp",
                    "lbl": "$end2"
                  }
                ]
              },
              {
                "label": "$else2",
                "stmts": [
                  {
                    "tag": "jmp",
                    "lbl": "$end2"
                  }
                ]
              },
              {
                "label": "$end2",
                "stmts": [
                  {
                    "tag": "assign",
                    "name": "b",
                    "value": {
                      "tag": "binop",
                      "op": 0,
                      "left": {
                        "tag": "id",
                        "name": "a"
                      },
                      "right": {
                        "tag": "num",
                        "value": 5n
                      }
                    }
                  }
                ]
              }
            ]
          }
    );

    assertOptimizeIR(
        "IR-while-propagate", 
        `
        a: int = 10
        i: int = 0
        b:int = 0
        while(i<3):
            a = 7 + 3
            i = i + 1
        b = a + 1 + i
        `,
        {
          "funs": [],
          "inits": [
            {
              "name": "valname6",
              "type": {
                "tag": "bool"
              },
              "value": {
                "tag": "none"
              }
            },
            {
              "name": "valname7",
              "type": {
                "tag": "number"
              },
              "value": {
                "tag": "none"
              }
            },
            {
              "name": "a",
              "type": {
                "tag": "number"
              },
              "value": {
                "tag": "num",
                "value": 10n
              },
            },
            {
              "name": "i",
              "type": {
                "tag": "number"
              },
              "value": {
                "tag": "num",
                "value": 0n
              },
            },
            {
              "name": "b",
              "type": {
                "tag": "number"
              },
              "value": {
                "tag": "num",
                "value": 0n
              },
            }
          ],
          "classes": [],
          "body": [
            {
              "label": "$startProg4",
              "stmts": [
                {
                  "tag": "jmp",
                  "lbl": "$whilestart1"
                }
              ]
            },
            {
              "label": "$whilestart1",
              "stmts": [
                {
                  "tag": "assign",
                  "name": "valname6",
                  "value": {
                    "tag": "binop",
                    "op": 9,
                    "left": {
                      "tag": "id",
                      "name": "i"
                    },
                    "right": {
                      "tag": "num",
                      "value": 3n
                    }
                  }
                },
                {
                  "tag": "ifjmp",
                  "cond": {
                    "tag": "id",
                    "name": "valname6",
                  },
                  "thn": "$whilebody1",
                  "els": "$whileend1"
                }
              ]
            },
            {
              "label": "$whilebody1",
              "stmts": [
                {
                  "tag": "assign",
                  "name": "a",
                  "value": {
                    "tag": "value",
                    "value": {
                      "tag": "num",
                      "value": 10n
                    }
                  }
                },
                {
                  "tag": "assign",
                  "name": "i",
                  "value": {
                    "tag": "binop",
                    "op": 0,
                    "left": {
                      "tag": "id",
                      "name": "i"
                    },
                    "right": {
                      "tag": "num",
                      "value": 1n
                    }
                  }
                },
                {
                  "tag": "jmp",
                  "lbl": "$whilestart1"
                }
              ]
            },
            {
              "label": "$whileend1",
              "stmts": [
                {
                  "tag": "assign",
                  "name": "valname7",
                  "value": {
                    "tag": "value",
                    "value": {
                      "tag": "num",
                      "value": 11n
                    }
                  }
                },
                {
                  "tag": "assign",
                  "name": "b",
                  "value": {
                    "tag": "binop",
                    "op": 0,
                    "left": {
                      "tag": "num",
                      "value": 11n
                    },
                    "right": {
                      "tag": "id",
                      "name": "i"
                    }
                  }
                }
              ]
            }
          ]
        }
    );

    assertOptimizeIR(
        "IR-fn-propagate", 
        `
        def f(b:int)->int:
            a:int = 2
            return b//a
        
        f(10)
        `,
        {
          "a": {
            "fromLoc": {
              "row": 1,
              "col": 1,
              "srcIdx": 0
            },
            "endLoc": {
              "row": 8,
              "col": 1,
              "srcIdx": 106
            },
            "eolLoc": {
              "row": 7,
              "col": 9,
              "srcIdx": 105
            },
            "src": "\n        def f(b:int)->int:\n            a:int = 2\n            return b//a\n        \n        f(10)\n        \n",
            "type": {
              "tag": "number"
            }
          },
          "funs": [
            {
              "name": "f",
              "parameters": [
                {
                  "name": "b",
                  "type": {
                    "tag": "number"
                  },
                  "a": {
                    "fromLoc": {
                      "row": 2,
                      "col": 15,
                      "srcIdx": 15
                    },
                    "endLoc": {
                      "row": 2,
                      "col": 20,
                      "srcIdx": 20
                    },
                    "eolLoc": {
                      "row": 2,
                      "col": 27,
                      "srcIdx": 27
                    }
                  }
                }
              ],
              "ret": {
                "tag": "number"
              },
              "inits": [
                {
                  "a": {
                    "fromLoc": {
                      "row": 4,
                      "col": 20,
                      "srcIdx": 69
                    },
                    "endLoc": {
                      "row": 4,
                      "col": 24,
                      "srcIdx": 73
                    },
                    "eolLoc": {
                      "row": 4,
                      "col": 24,
                      "srcIdx": 73
                    },
                    "type": {
                      "tag": "number"
                    }
                  },
                  "name": "valname8",
                  "type": {
                    "tag": "number"
                  },
                  "value": {
                    "tag": "none"
                  }
                },
                {
                  "name": "a",
                  "type": {
                    "tag": "number"
                  },
                  "value": {
                    "tag": "num",
                    "value": 2n,
                    "a": {
                      "fromLoc": {
                        "row": 3,
                        "col": 21,
                        "srcIdx": 48
                      },
                      "endLoc": {
                        "row": 3,
                        "col": 22,
                        "srcIdx": 49
                      },
                      "eolLoc": {
                        "row": 3,
                        "col": 22,
                        "srcIdx": 49
                      }
                    }
                  },
                  "a": {
                    "fromLoc": {
                      "row": 3,
                      "col": 13,
                      "srcIdx": 40
                    },
                    "endLoc": {
                      "row": 3,
                      "col": 22,
                      "srcIdx": 49
                    },
                    "eolLoc": {
                      "row": 3,
                      "col": 22,
                      "srcIdx": 49
                    }
                  }
                }
              ],
              "body": [
                {
                  "a": {
                    "fromLoc": {
                      "row": 2,
                      "col": 9,
                      "srcIdx": 9
                    },
                    "endLoc": {
                      "row": 6,
                      "col": 1,
                      "srcIdx": 83
                    },
                    "eolLoc": {
                      "row": 5,
                      "col": 9,
                      "srcIdx": 82
                    },
                    "type": {
                      "tag": "none"
                    }
                  },
                  "label": "$startFun5",
                  "stmts": [
                    {
                      "tag": "expr",
                      "expr": {
                        "tag": "call",
                        "name": "divide_by_zero",
                        "arguments": [
                          {
                            "tag": "num",
                            "value": 2n,
                            "a": {
                              "fromLoc": {
                                "row": 4,
                                "col": 23,
                                "srcIdx": 72
                              },
                              "endLoc": {
                                "row": 4,
                                "col": 24,
                                "srcIdx": 73
                              },
                              "eolLoc": {
                                "row": 4,
                                "col": 24,
                                "srcIdx": 73
                              },
                              "type": {
                                "tag": "number"
                              }
                            }
                          },
                          {
                            "tag": "wasmint",
                            "value": 5
                          }
                        ]
                      }
                    },
                    {
                      "tag": "assign",
                      "a": {
                        "fromLoc": {
                          "row": 4,
                          "col": 20,
                          "srcIdx": 69
                        },
                        "endLoc": {
                          "row": 4,
                          "col": 24,
                          "srcIdx": 73
                        },
                        "eolLoc": {
                          "row": 4,
                          "col": 24,
                          "srcIdx": 73
                        },
                        "type": {
                          "tag": "number"
                        }
                      },
                      "name": "valname8",
                      "value": {
                        "tag": "binop",
                        "op": 3,
                        "left": {
                          "tag": "id",
                          "name": "b",
                          "a": {
                            "fromLoc": {
                              "row": 4,
                              "col": 20,
                              "srcIdx": 69
                            },
                            "endLoc": {
                              "row": 4,
                              "col": 21,
                              "srcIdx": 70
                            },
                            "eolLoc": {
                              "row": 4,
                              "col": 24,
                              "srcIdx": 73
                            },
                            "type": {
                              "tag": "number"
                            }
                          }
                        },
                        "right": {
                          "tag": "num",
                          "value": 2n
                        },
                        "a": {
                          "fromLoc": {
                            "row": 4,
                            "col": 20,
                            "srcIdx": 69
                          },
                          "endLoc": {
                            "row": 4,
                            "col": 24,
                            "srcIdx": 73
                          },
                          "eolLoc": {
                            "row": 4,
                            "col": 24,
                            "srcIdx": 73
                          },
                          "type": {
                            "tag": "number"
                          }
                        }
                      }
                    },
                    {
                      "tag": "return",
                      "a": {
                        "fromLoc": {
                          "row": 4,
                          "col": 20,
                          "srcIdx": 69
                        },
                        "endLoc": {
                          "row": 4,
                          "col": 24,
                          "srcIdx": 73
                        },
                        "eolLoc": {
                          "row": 4,
                          "col": 24,
                          "srcIdx": 73
                        },
                        "type": {
                          "tag": "number"
                        }
                      },
                      "value": {
                        "tag": "id",
                        "name": "valname8",
                        "a": {
                          "fromLoc": {
                            "row": 4,
                            "col": 20,
                            "srcIdx": 69
                          },
                          "endLoc": {
                            "row": 4,
                            "col": 24,
                            "srcIdx": 73
                          },
                          "eolLoc": {
                            "row": 4,
                            "col": 24,
                            "srcIdx": 73
                          },
                          "type": {
                            "tag": "number"
                          }
                        }
                      }
                    }
                  ]
                }
              ],
              "a": {
                "fromLoc": {
                  "row": 2,
                  "col": 9,
                  "srcIdx": 9
                },
                "endLoc": {
                  "row": 6,
                  "col": 1,
                  "srcIdx": 83
                },
                "eolLoc": {
                  "row": 5,
                  "col": 9,
                  "srcIdx": 82
                },
                "type": {
                  "tag": "none"
                }
              }
            }
          ],
          "inits": [],
          "classes": [],
          "body": [
            {
              "a": {
                "fromLoc": {
                  "row": 1,
                  "col": 1,
                  "srcIdx": 0
                },
                "endLoc": {
                  "row": 8,
                  "col": 1,
                  "srcIdx": 106
                },
                "eolLoc": {
                  "row": 7,
                  "col": 9,
                  "srcIdx": 105
                },
                "src": "\n        def f(b:int)->int:\n            a:int = 2\n            return b//a\n        \n        f(10)\n        \n",
                "type": {
                  "tag": "number"
                }
              },
              "label": "$startProg9",
              "stmts": [
                {
                  "tag": "expr",
                  "a": {
                    "fromLoc": {
                      "row": 6,
                      "col": 9,
                      "srcIdx": 91
                    },
                    "endLoc": {
                      "row": 6,
                      "col": 14,
                      "srcIdx": 96
                    },
                    "eolLoc": {
                      "row": 6,
                      "col": 14,
                      "srcIdx": 96
                    },
                    "type": {
                      "tag": "number"
                    }
                  },
                  "expr": {
                    "tag": "call",
                    "name": "f",
                    "arguments": [
                      {
                        "tag": "num",
                        "value": 10n,
                        "a": {
                          "fromLoc": {
                            "row": 6,
                            "col": 11,
                            "srcIdx": 93
                          },
                          "endLoc": {
                            "row": 6,
                            "col": 13,
                            "srcIdx": 95
                          },
                          "eolLoc": {
                            "row": 6,
                            "col": 14,
                            "srcIdx": 96
                          }
                        }
                      }
                    ],
                    "a": {
                      "fromLoc": {
                        "row": 6,
                        "col": 9,
                        "srcIdx": 91
                      },
                      "endLoc": {
                        "row": 6,
                        "col": 14,
                        "srcIdx": 96
                      },
                      "eolLoc": {
                        "row": 6,
                        "col": 14,
                        "srcIdx": 96
                      },
                      "type": {
                        "tag": "number"
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
    );


    assertOptimize(
        "sanity-simple-constant-folding", 
        `
        a: int = 0
        print(a)
        a = 5 + 7
        print(a)
        `,
        { print: ["0","12"], isIrDifferent: true }
    );

    assertOptimize(
        "sanity-complex-constant-folding", 
        `
        a:int=1
        a=1*2-1+4
        print(a)
        `,
        { print: ["5"], isIrDifferent: true }
    );

    assertOptimize(
        "sanity-while-constant-folding-neg", 
        `
        a:int=10
        b:int = 5
        while a<10:
            a = 1
        b = a
        print(b)
        `,
        { print: ["10"], isIrDifferent: false }
    );

    assertOptimize(
        "sanity-if-constant-prop", 
        `
        a:int = 3
        if 0<3:
            a = 4
            print(a)
        `,
        { print: ["4"], isIrDifferent: true }
    );

    assertOptimize(
        "sanity-if-constant-prop-neg", 
        `
        a:int = 3
if False:
   a = 4
else:
   a = 5
print(a)
        `,
        { print: ["5"], isIrDifferent: false }
    );

    assertOptimize(
        "sanity-while-constant-prop-folding", 
        `
        a:int=1
        b:int = 5
        while a<3:
            b = 2 + 3
            a = a + 1
            print(a)
        print(b)
        `,
        { print: ["2", "3", "5"], isIrDifferent: true }
    );

    assertOptimize(
      "sanity-nestedif-1lev-constant-prop-folding",
      `
      a:int = 10
      b:int = 100
      if a==10:
          if b==100:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      
      print(b)
      `,
      {print: ["1340"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-nestedif-1lev-constant-prop-folding-neg",
      `
      a:int = 10
      b:int = 100
      if True:
          if False:
              a = 2
              b = 3
          if True:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      print(b)
      `,
      {print: ["1340"], isIrDifferent: false}
    )

    assertOptimize(
      "sanity-nestedif-while-1lev-constant-prop-folding",
      `
      a:int = 10
      b:int = 100
      c:int = 1
      i:int = 0
      while(i<10):
          if a==10:
            if b==100:
                c = b+a+b*a+b//a+b%a+b+a+b+a
          i = i+1
      print(c)
      `,
      {print: ["1340"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-nestedif-func-1lev-constant-prop-folding-neg",
      `
      def fun1()->int:
          return 10
      
      a:int = 10
      b:int = 100
      if True:
          if False:
              a = fun1()
              b = fun1()*10
          if True:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      print(b)
      `,
      {print: ["1340"], isIrDifferent: false}
    )

    assertOptimize(
      "sanity-nestedif-func-1lev-constant-prop-folding",
      `
      def fun1(a:int, b:int)->int:
          return a+b
      
      a:int = 10
      b:int = 100
      if True:
          if False:
              a = fun1(a,b)
          if True:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      print(b)
      `,
      {print: ["1340"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-nestedif-func-1lev-constant-prop-folding",
      `
      def fun1(a:int, b:int)->int:
          return a+b
      
      a:int = 10
      b:int = 100
      if True:
          if False:
              a = fun1(a,b)
          if True:
              b = b+a+b*a+b//a+b%a+b+a+b+a
      print(b)
      `,
      {print: ["1340"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-many-variables-constant-fold",
      `
a:int = 1
b:int = 10
c:int = 1000
d:int = 109
if True:
  c = a+9
  if False:
    d= b*10 +9
    if True:
      d = a+b+c-c-a*2+b//2
print(d)
      `,
      {print: ["109"], isIrDifferent: true}
    )

    assertOptimize(
      "sanity-many-variables-constant-fold",
      `
a:int = 1
b:int = 10
c:int = 1000
d:int = 109
if True:
  c = 11
  if False:
    b=2
    a=1
    if True:
      d = a+b+c-c-a*2+b//2
print(d)
      `,
      {print: ["109"], isIrDifferent: true}
    )

});