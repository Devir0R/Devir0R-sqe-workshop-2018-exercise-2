import escodegen from 'escodegen';
import * as esprima from 'esprima';

const parseCode = (codeToParse,input_vector) => {
    let ent = enterprate(input_vector);
    let parsedCode = esprima.parseScript(codeToParse);
    traverseBuild(parsedCode,null,-1,handle,ent);
    traverseBuild(parsedCode,null,-1,assRemover,{});
    traverseBuild(parsedCode,null,-1,decRemover,{});
    let ans = escodegen.generate(parsedCode);
    return ans;
};

export {parseCode};

let inFunction = false;
let cases = [
    ['VariableDeclarator',varDecHandle],
    ['Program',progHandle],
    ['AssignmentExpression',assHandle],
    ['ReturnStatement',retHandle],
    ['IfStatement',ifHandle],
    ['FunctionDeclaration',funcHandle],
    ['WhileStatement',whileHandle],
    ['ArrayExpression',arrHandle],
    ['MemberExpression',memberHandle]
];

let doNotRemove = [];

function checkIfAssignment(node) {
    return node.type !== undefined && node.type.includes('ExpressionStatement')
        && node.expression.type !== undefined && node.expression.type.includes('AssignmentExpression');
}

function isAss(node) {
    let isMemberAssignment = (node.expression.left.type!==undefined && node.expression.left.type.includes('MemberExpression'));
    return checkIfAssignment(node) && !isMemberAssignment
        && !doNotRemove.includes(keyfy(node.expression.left));
}

function isDec(node) {
    return node.type !== undefined && node.type.includes('VariableDeclaration');
}

function removeAssignmentFromTree(father) {
    var deleted = 0;
    for (var i = 0; i < father.length; i++) {
        father[i - deleted] = father[i];
        if (isAss(father[i])) {
            deleted++;
        }
    }
    while (deleted > 0) {
        father.pop();
        deleted--;
    }
}

function assRemover(node,father,keyOrIndex,env){
    if(node.type === undefined) {
        return;
    }
    if(inFunction && Array.isArray(father)){
        removeAssignmentFromTree(father);
    }
    return handleTypes(node,father,keyOrIndex,env);
}

function removeDeclarations(father) {
    var deleted = 0;
    for (var i = 0; i < father.length; i++) {
        father[i - deleted] = father[i];
        if (isDec(father[i])) {
            deleted++;
        }
    }
    while (deleted > 0) {
        father.pop();
        deleted--;
    }
}

function decRemover(node,father,keyOrIndex,env){
    if(node.type === undefined) {
        return;
    }
    if(inFunction && Array.isArray(father)){
        removeDeclarations(father);
    }
    return handleTypes(node,father,keyOrIndex,env);
}

function isDecInFunctionDec(father) {
    return father.type!=undefined && !father.type.includes('FunctionDeclaration');
}

function shouldBeReplaced(node, father, keyOrIndex) {
    return !isLvalue(node, father, keyOrIndex) && isDecInFunctionDec(father);
}

function handle(node,father,keyOrIndex,env) {
    if(node.type === undefined) {
        return;
    }
    if(keyfy(node) in env && inFunction){
        if(shouldBeReplaced(node, father, keyOrIndex)) {
            father[keyOrIndex] = env[keyfy(node)];
        }
    }
    return handleTypes(node,father,keyOrIndex,env);
}

function leftInDeclaration(fatherType, keyOrIndex) {
    return fatherType.includes('VariableDeclarator') && keyfy(keyOrIndex).includes('id');
}

function leftInAssignment(fatherType, keyOrIndex) {
    return fatherType.includes('AssignmentExpression') && keyfy(keyOrIndex).includes('left');
}

function isLvalue(node,father,keyOrIndex){
    let fatherType = father.type;
    if(fatherType===undefined){
        return false;
    }
    if(leftInDeclaration(fatherType, keyOrIndex)){
        return true;
    }
    if(leftInAssignment(fatherType, keyOrIndex)){
        return true;
    }
    return false;
}

function keyfy(obj) {
    return JSON.stringify(obj, null, 2);
}
function enterprate(input_vector) {
    let env = {};
    let assArray = esprima.parseScript(input_vector);
    traverse(assArray,function (node) {
        if(node.type.includes('AssignmentExpression')){
            putInEnv(node.left,node.right,env);
        }
    });
    return env;
}

function progHandle(/*node,father,keyOrIndex,env*/){
}//

function handleTypes(node,father,keyOrIndex,env) {
    for(var i =0;i<cases.length;i++){
        if(node.type.includes(cases[i][0])){
            let handler = cases[i][1];
            return handler(node,father,keyOrIndex,env);
        }
    }
}//


function varDecHandle(node,father,keyOrIndex,env){
    let f = function (){
        putInEnv(node.id,node.init,env);
    };
    return f;
}

function assHandle(node,father,keyOrIndex,env){
    let f = function (){
        putInEnv(node.left,node.right,env);
    };
    return f;
}
function retHandle(/*node,father,keyOrIndex,env*/){
}
function ifHandle(node,father,keyOrIndex,env){
    let old_env = deepCopy(env);
    return function (node, father, keyOrIndex, func, env) {
        for (var prop in env) {
            if (env.hasOwnProperty(prop)) {
                delete env[prop];
            }
        }
        for (var prop2 in old_env) {
            if (old_env.hasOwnProperty(prop2)) {
                env[prop2] = old_env[prop2];
            }
        }
    };
}
function funcHandle(node/*,father,keyOrIndex,env*/){
    inFunction = true;
    node.params.forEach(function(n){
        doNotRemove.push(keyfy(n));
    });
    return function () {
        inFunction = false;
    };
}

function whileHandle(node,father,keyOrIndex,env){
    return ifHandle(node,father,keyOrIndex,env);
}
/*
function forHandle(node,father,keyOrIndex,env){
    //TODO
    return ifHandle(node,father,keyOrIndex,env);
}
function forInHandle(node,father,keyOrIndex,env){
    return ifHandle(node,father,keyOrIndex,env);
}*/
function arrHandle(node,father,keyOrIndex,env){
    //TODO
    return ifHandle(node,father,keyOrIndex,env);
}
function memberHandle(/*node,father,keyOrIndex,env*/){
}

function putInEnv(id,value,env) {
    env[keyfy(id)] = value;
    if(!inFunction){
        doNotRemove.push(keyfy(id));
    }
}

function traverseChildren(child, func) {
    if (Array.isArray(child)) {
        for (var i = 0; i < child.length; i += 1){ //5
            traverse(child[i], func);
        }
    } else {
        traverse(child, func); //6
    }
}

function deepenTheTraverse(node, key, func) {
    if (node.hasOwnProperty(key)) { //3
        var child = node[key];
        if (typeof child === 'object' && child !== null) { //4
            traverseChildren(child, func);
        }
    }
}

function traverse(node, func) {
    let funcEnd = func(node);//1
    for (var key in node) { //2
        deepenTheTraverse(node, key, func);
    }
    if(isVarFunction(funcEnd)){
        funcEnd(node);
    }
}

function traverseBuildChildren(child,father,keyOrIndex,func,env) {
    if (Array.isArray(child)) {
        for (var i = 0; i < child.length; i += 1){ //5
            traverseBuild(child[i],child,i, func,env);
        }
    } else {
        traverseBuild(child,father,keyOrIndex, func,env); //6
    }
}

function deepCopy(obj){
    return JSON.parse(JSON.stringify(obj));
}

function buildChildren(child, key, node, func, env) {
    if (typeof child === 'object' && child !== null) { //4
        if (keyfy(key).includes('consequent') || keyfy(key).includes('consequent')) {
            traverseBuildChildren(child, node, key, func, deepCopy(env));

        }
        else {
            traverseBuildChildren(child, node, key, func, env);
        }
    }
}

function traverseBuild(node,father,keyOrIndex,func,env) {
    let funcEnd = func(node,father,keyOrIndex,env);//1
    for (var key in node) { //2
        if (node.hasOwnProperty(key)) { //3
            var child = node[key];
            buildChildren(child, key, node, func, env);
        }
    }
    if(isVarFunction(funcEnd)){
        funcEnd(node,father,keyOrIndex,func,env);
    }
}

function isVarFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}