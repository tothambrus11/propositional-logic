import {exclude_internal_props} from "svelte/internal";

export enum TokenType {
    Variable,
    UnaryOperator,
    BinaryOperator,
    LParenthesis,
    RParenthesis
}

export interface TokenBase {
    tokenType: TokenType;
}

export interface Variable extends TokenBase {
    tokenType: TokenType.Variable;
    name: string;
}

export interface UnaryConnective extends TokenBase {
    tokenType: TokenType.UnaryOperator;
    opType: OperatorType;
}

export interface BinaryConnective extends TokenBase {
    tokenType: TokenType.BinaryOperator;
    opType: OperatorType;
}

export enum OperatorType {
    Not,
    And,
    Or,
    Xor,
    Nor,
    Nand,
    Implication,
    ImplicationReversed,
    BiImplication
}

const precedences = {
    [OperatorType.Not]: 1,
    [OperatorType.And]: 2,
    [OperatorType.Nand]: 2,
    [OperatorType.Xor]: 2,
    [OperatorType.Or]: 3,
    [OperatorType.Nor]: 3,
    [OperatorType.Implication]: 4,
    [OperatorType.ImplicationReversed]: 4,
    [OperatorType.BiImplication]: 5
};

export type Token = BinaryConnective | UnaryConnective | TokenBase | Variable;
export type OperatorToken = UnaryConnective | BinaryConnective;

export function lex(text: string): Token[] {
    let list: Token[] = [];
    for (let i = 0; i < text.length; i++) {
        let c = text.charAt(i);
        switch (c) {
            case ' ':
                continue;
            case '∨':
                list.push({tokenType: TokenType.BinaryOperator, opType: OperatorType.Or});
                break;
            case '∧':
                list.push({tokenType: TokenType.BinaryOperator, opType: OperatorType.And});
                break;
            case '¬':
                list.push({tokenType: TokenType.UnaryOperator, opType: OperatorType.Not});
                break;
            case '→':
                list.push({tokenType: TokenType.BinaryOperator, opType: OperatorType.Implication});
                break;
            case '←':
                list.push({tokenType: TokenType.BinaryOperator, opType: OperatorType.ImplicationReversed});
                break;
            case '↔':
                list.push({tokenType: TokenType.BinaryOperator, opType: OperatorType.BiImplication});
                break;
            case '(':
                list.push({tokenType: TokenType.LParenthesis});
                break;
            case ')':
                list.push({tokenType: TokenType.RParenthesis});
                break;
            case '⊕':
                list.push({tokenType: TokenType.BinaryOperator, opType: OperatorType.Xor});
                break;
            case '↓':
                list.push({tokenType: TokenType.BinaryOperator, opType: OperatorType.Nor});
                break;
            case '↑':
                list.push({tokenType: TokenType.BinaryOperator, opType: OperatorType.Nand});
                break;
            default:
                list.push({tokenType: TokenType.Variable, name: c});

        }
    }

    return list;
}

type Expression = (Token | Expression)[];

export function parse(tokens: Token[]): ASTNode {
    // Generate expressions:
    let expression = [];
    let currentExpression = expression;
    let expressionStack = [];
    expressionStack.push(currentExpression);
    tokens.forEach(token => {
        switch (token.tokenType) {
            case TokenType.LParenthesis:
                currentExpression.push([]);
                currentExpression = currentExpression[currentExpression.length - 1];
                expressionStack.push(currentExpression);
                break;
            case TokenType.RParenthesis:
                expressionStack.pop();
                currentExpression = expressionStack[expressionStack.length - 1];
                break;
            default:
                currentExpression.push(token);
        }
    });
    console.log(expression);

    return nodeifyExpression(expression, 0, expression.length);
}

function nodeifyExpression(expression: Expression, subExpStart: number, subExpEnd: number): ASTNode {
    let maxPrecedence = 0;
    let mostMainConnective: OperatorToken;
    let mostMainConnectiveIndex: number;

    for (let i = subExpStart; i < subExpEnd; i++) {
        let expItem = expression[i];
        if (!(expItem instanceof Array) && (expItem.tokenType === TokenType.UnaryOperator || expItem.tokenType === TokenType.BinaryOperator)) {
            if (precedences[(expItem as OperatorToken).opType] > maxPrecedence) {
                maxPrecedence = precedences[(expItem as OperatorToken).opType];
                mostMainConnective = expItem as OperatorToken;
                mostMainConnectiveIndex = i;
            }
        }
    }
    if (!mostMainConnective) {
        if (subExpEnd - subExpStart == 1) {
            let expItem = expression[subExpStart];
            if (expItem instanceof Array) {
                return nodeifyExpression(expItem, 0, expItem.length);
            } else if ((expression[subExpStart] as Token).tokenType === TokenType.Variable) {
                return new VariableNode((expression[subExpStart] as Variable).name);
            }
        } else if (subExpEnd - subExpStart == 0) {
            return null;
        } else {
            return null;
        }
    }

    switch (mostMainConnective.opType) {
        case OperatorType.And:
            return new AndNode(
                nodeifyExpression(expression, subExpStart, mostMainConnectiveIndex),
                nodeifyExpression(expression, mostMainConnectiveIndex + 1, subExpEnd),
            );
        case OperatorType.BiImplication:
            return new BiImplicationNode(
                nodeifyExpression(expression, subExpStart, mostMainConnectiveIndex),
                nodeifyExpression(expression, mostMainConnectiveIndex + 1, subExpEnd),
            );
        case OperatorType.ImplicationReversed:
            return new ImplicationReversedNode(
                nodeifyExpression(expression, subExpStart, mostMainConnectiveIndex),
                nodeifyExpression(expression, mostMainConnectiveIndex + 1, subExpEnd),
            );
        case OperatorType.Implication:
            return new ImplicationNode(
                nodeifyExpression(expression, subExpStart, mostMainConnectiveIndex),
                nodeifyExpression(expression, mostMainConnectiveIndex + 1, subExpEnd),
            );
        case OperatorType.Xor:
            return new XorNode(
                nodeifyExpression(expression, subExpStart, mostMainConnectiveIndex),
                nodeifyExpression(expression, mostMainConnectiveIndex + 1, subExpEnd),
            );
        case OperatorType.Or:
            return new OrNode(
                nodeifyExpression(expression, subExpStart, mostMainConnectiveIndex),
                nodeifyExpression(expression, mostMainConnectiveIndex + 1, subExpEnd),
            );
        case OperatorType.Not:
            return new NotNode(
                nodeifyExpression(expression, subExpStart + 1, subExpEnd)
            );
        case OperatorType.Nor:
            return new NorNode(
                nodeifyExpression(expression, subExpStart, mostMainConnectiveIndex),
                nodeifyExpression(expression, mostMainConnectiveIndex + 1, subExpEnd)
            );
        case OperatorType.Nand:
            return new NandNode(
                nodeifyExpression(expression, subExpStart, mostMainConnectiveIndex),
                nodeifyExpression(expression, mostMainConnectiveIndex + 1, subExpEnd)
            );
        default:
            throw new Error("wtf 222");
    }

}

export interface Variables {
    [key: string]: boolean;
}

export abstract class ASTNode {
    abstract result(vars: Variables): boolean;
}

export abstract class UnaryConnectiveNode extends ASTNode {
    constructor(public child: ASTNode) {
        super();
    }
}

export abstract class BinaryConnectiveNode extends ASTNode {
    constructor(public childLeft: ASTNode,
                public childRight: ASTNode) {
        super();
    }
}

let variables = {'q': true, 'p': false, 'r': true};

export class VariableNode extends ASTNode {
    constructor(public name: string) {
        super();
    }

    result(vars: Variables): boolean {
        return vars[this.name];
    }
}
class InvalidExpressionError extends Error {

}

class NotNode extends UnaryConnectiveNode {
    result(vars: Variables): boolean {
        if(!this.child) throw new InvalidExpressionError();
        return !this.child.result(vars);
    }
}

class AndNode extends BinaryConnectiveNode {
    result(vars: Variables): boolean {
        if(!this.childLeft || !this.childRight) throw new InvalidExpressionError();
        return this.childLeft.result(vars) && this.childRight.result(vars);
    }
}

class NandNode extends BinaryConnectiveNode {
    result(vars: Variables): boolean {
        if(!this.childLeft || !this.childRight) throw new InvalidExpressionError();
        return !(this.childLeft.result(vars) && this.childRight.result(vars));
    }
}

class OrNode extends BinaryConnectiveNode {
    result(vars: Variables): boolean {
        if(!this.childLeft || !this.childRight) throw new InvalidExpressionError();
        return this.childLeft.result(vars) || this.childRight.result(vars);
    }
}

class NorNode extends BinaryConnectiveNode {
    result(vars: Variables): boolean {
        if(!this.childLeft || !this.childRight) throw new InvalidExpressionError();
        return !(this.childLeft.result(vars) || this.childRight.result(vars));
    }
}

class XorNode extends BinaryConnectiveNode {
    result(vars: Variables): boolean {
        if(!this.childLeft || !this.childRight) throw new InvalidExpressionError();
        return this.childLeft.result(vars) != this.childRight.result(vars);
    }
}

class BiImplicationNode extends BinaryConnectiveNode {
    result(vars: Variables): boolean {
        if(!this.childLeft || !this.childRight) throw new InvalidExpressionError();
        return this.childLeft.result(vars) === this.childRight.result(vars);
    }
}

class ImplicationNode extends BinaryConnectiveNode {
    result(vars: Variables): boolean {
        if(!this.childLeft || !this.childRight) throw new InvalidExpressionError();
        return !this.childLeft.result(vars) || this.childRight.result(vars);
    }
}

class ImplicationReversedNode extends BinaryConnectiveNode {
    result(vars: Variables): boolean {
        if(!this.childLeft || !this.childRight) throw new InvalidExpressionError();
        return this.childLeft.result(vars) || !this.childRight.result(vars);
    }
}