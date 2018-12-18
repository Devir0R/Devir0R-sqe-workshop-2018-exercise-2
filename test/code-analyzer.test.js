import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import * as esprima from 'esprima';
import escodegen from 'escodegen';

describe('The javascript parser', () => {
    let subs = function (p,v){
        return parseCode(p,v);
    };
    it('is parsing an empty function correctly', () => {
        assert.equal(
            subs('','[]'),
            ''
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(subs('let a = 1;','[]')),
            '"let a = 1;"'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(subs('a[0] = 1;','[]')),
            '"a[0] = 1;"'
        );
    });


    it('is parsing the example test 1', ()=>{
        assert.equal(
            JSON.stringify(subs('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;} else if (b < z * 2) {c = c + x + 5;return x + y + z + c;} else {c = c + z + 5;return x + y + z + c;}}','[]')),
            '"function foo(x, y, z) {\\n    if (x + 1 + y < z) {\\n        return x + y + z + (0 + 5);\\n    } else if (x + 1 + y < z * 2) {\\n        return x + y + z + (0 + x + 5);\\n    } else {\\n        return x + y + z + (0 + z + 5);\\n    }\\n}"'
        ) ;
    });


    it('is parsing the example test 2', () => {
        assert.equal(
            JSON.stringify(subs('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;while (a < z) {c = a + b;z = c * 2;}return z;}','[]')),
            '"function foo(x, y, z) {\\n    while (x + 1 < z) {\\n        z = (x + 1 + (x + 1 + y)) * 2;\\n    }\\n    return z;\\n}"'
        );
    });

    it('input vector with one assignment', () => {
        assert.equal(
            JSON.stringify(subs('function foo(x){let y = x;let z = x;let w = x;let u = x;return y + z + w + u;}','[x=5]')),
            '"function foo(x) {\\n    return 5 + 5 + 5 + 5;\\n}"'
        );
    });

    it('input vector with one assignment, and delaration out of the function', () => {
        assert.equal(
            JSON.stringify(subs('let t = 2;function foo(x){let y = x + t;let z = x;let w = x;let u = x;return y + z + w + u;}','[x=5]')),
            '"let t = 2;\\nfunction foo(x) {\\n    return 5 + 2 + 5 + 5 + 5;\\n}"'
        );
    });

    it('array test', () => {
        assert.equal(
            JSON.stringify(subs('let t = [1,2,3,4,5];function foo(x){let i = t[3];if(i==4)return i+2;}','[]')),
            '"let t = [\\n    1,\\n    2,\\n    3,\\n    4,\\n    5\\n];\\nfunction foo(x) {\\n    if ([\\n            1,\\n            2,\\n            3,\\n            4,\\n            5\\n        ][3] == 4)\\n        return [\\n            1,\\n            2,\\n            3,\\n            4,\\n            5\\n        ][3] + 2;\\n}"'
        );
    });

    it('is parsing an empty function correctly', () => {
        assert.equal(
            subs('function bubbleSort(arr){var len = arr.length;while (i>=0&& i<len){while(j<=i){if(2>1){var temp = arr[j-1];arr[j-1] = arr[j];arr[j] = temp;}}}return arr;}','[]'),
            'function bubbleSort(arr) {\n    while (i >= 0 && i < arr.length) {\n        while (j <= i) {\n            if (2 > 1) {\n                var temp = arr[j - 1];\n                arr[j - 1] = arr[j];\n                arr[j] = arr[j - 1];\n            }\n        }\n    }\n    return arr;\n}'
        );
    });

    it('is parsing an empty function correctly', () => {
        assert.equal(
            subs('function foo() {if ( ! b) {return a;} return a/b;}','[a=5,b=0]'),
            'function foo() {\n    if (!0) {\n        return 5;\n    }\n    return 5 / 0;\n}'
        );
    });

});
