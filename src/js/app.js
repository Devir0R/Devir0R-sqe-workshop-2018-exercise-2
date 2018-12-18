import $ from 'jquery';
import {parseCode} from './code-analyzer';


function spacesAtStart(lines, i, line) {
    for (let j = 0, b = true; j < lines[i].length; j++) {
        if (b) {
            if (lines[i].charAt(j) === ' ') {
                line += '&nbsp;';
            }
            else {
                b = false;
                line += lines[i].charAt(j);
            }
        }
        else {
            line += lines[i].charAt(j);
        }
    }
    return line;
}

function markIf(line, isGreened, markedCode) {
    let term = line.substr(line.indexOf('(') + 1, line.lastIndexOf(')') - line.indexOf('(') - 1);
    let testEval = eval(term);
    if (!isGreened && testEval) {
        markedCode += '<br>' + '<markgreen>' + line + '</markgreen>';
        isGreened = true;
    }
    else if (!isGreened) {
        markedCode += '<br>' + '<markred>' + line + '</markred>';
    }
    else {
        markedCode += '<br>' + line;
    }
    return {isGreened, markedCode};
}

function markElse(isGreened, markedCode, line) {
    if (!isGreened) {
        markedCode += '<br>' + '<markgreen>' + line + '</markgreen>';
    }
    else {
        markedCode += '<br>' + line;
        isGreened = false;
    }
    return {isGreened, markedCode};
}

function handleOneLine(lines, i, isGreened, markedCode) {
    let line = '';
    line = spacesAtStart(lines, i, line);
    if (line.includes('if (')) {
        const __ret = markIf(line, isGreened, markedCode);
        isGreened = __ret.isGreened;
        markedCode = __ret.markedCode;
    }
    else if (line.includes('else')) {
        const __ret = markElse(isGreened, markedCode, line);
        isGreened = __ret.isGreened;
        markedCode = __ret.markedCode;
    }
    else {
        markedCode += '<br>' + line;
    }
    return {isGreened, markedCode};
}

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let input_vector = $('#inpVec').val();
        let parsedCode = parseCode(codeToParse,input_vector);
        let markedCode = '';
        let lines = parsedCode.split('\n');
        var isGreened = false;

        for(let i =0;i<lines.length;i++){
            const __ret = handleOneLine(lines, i, isGreened, markedCode);
            isGreened = __ret.isGreened;
            markedCode = __ret.markedCode;
        }
        $('#parsedCode').html(markedCode);
    });
});
