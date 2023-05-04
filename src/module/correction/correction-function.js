'use strict';

// fs
const { readdirSync } = require('fs');

// file module
const fileModule = require('../system/file-module');

// kana character
const allKana = /^[ぁ-ゖァ-ヺ]+$/gi;

// skip check
function skipCheck(code, name, text, ignoreArray) {
    return (name + text).includes('') || (['0039', '0839'].includes(code) && canIgnore(text, ignoreArray));
}

// replace text
function replaceText(text, array, search = 0, replacement = 1) {
    if (text === '' || !Array.isArray(array) || !array.length > 0) {
        return text;
    }

    const target = includesArrayItem(text, array, search);

    if (target) {
        for (let index = 0; index < target.length; index++) {
            const element = target[index];
            text = text.replaceAll(element[search] + '公司', element[replacement]);
            text = text.replaceAll(element[search], element[replacement]);
        }
    }

    return text;
}

// can ignore
function canIgnore(text, ignoreArray) {
    if (text === '' || !Array.isArray(ignoreArray) || !ignoreArray.length > 0) {
        return false;
    }

    for (let index = 0; index < ignoreArray.length; index++) {
        if (text.match(new RegExp(ignoreArray[index], 'gi'))) {
            return true;
        }
    }

    return false;
}

// includes array item
function includesArrayItem(text, array, searchIndex = 0) {
    // search array
    let searchArray = array;

    // target
    let target = null;

    if (text === '' || !Array.isArray(array) || !array.length > 0) {
        return target;
    }

    // 2d check
    if (Array.isArray(array[0])) {
        searchArray = array.map((value) => value[searchIndex]);
    }

    // match
    let temp = [];
    for (let index = 0; index < searchArray.length; index++) {
        const element = searchArray[index].replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (new RegExp(element, 'gi').test(text)) {
            text = text.replaceAll(element, '');
            temp.push(array[index]);
        }
    }

    target = temp.length > 0 ? temp : null;

    return target;
}

// same as array item
function sameAsArrayItem(text, array, searchIndex = 0) {
    // search array
    let searchArray = array;

    // target
    let target = null;

    if (text === '' || !Array.isArray(array) || !array.length > 0) {
        return target;
    }

    // 2d check
    if (Array.isArray(array[0])) {
        searchArray = array.map((value) => value[searchIndex]);
    }

    // match
    for (let index = 0; index < searchArray.length; index++) {
        const element = searchArray[index].replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (new RegExp('^' + element + '$', 'gi').test(text)) {
            target = [array[index], index];
            break;
        }
    }

    return target;
}

// mark fix
function markFix(text, isTranslated = false) {
    // remove （） and its content
    text = text.replaceAll(/（.*?）/gi, '');

    // remove () and its content
    text = text.replaceAll(/\(.*?\)/gi, '');

    if (isTranslated) {
        // fix 「「
        if (text.includes('「') && !text.includes('」')) {
            text = text.replaceAll(/「(.+?)「/gi, '「$1」');
        }

        // fix 」」
        if (text.includes('」') && !text.includes('「')) {
            text = text.replaceAll(/」(.+?)」/gi, '「$1」');
        }

        // fix ""
        //text = text.replaceAll(/"(.+?)"/gi, '「$1」');

        // fix .
        text = text.replaceAll(/([^.0-9])\.([^.0-9])/gi, '$1・$2');

        // fix ·
        text = text.replaceAll(/([^·0-9])·([^·0-9])/gi, '$1・$2');

        // fix 0
        text = text.replaceAll(/([^-,.\w]|^)0([^-,.\w%]|$)/gi, '$1零$2');
        text = text.replaceAll(/zero/gi, '零');
    }

    return text;
}

// clear code
function clearCode(text, table) {
    if (table.length > 0) {
        table.forEach((value) => {
            const character = value[0];
            text = text.replaceAll(new RegExp(`\\s?${character}+\\s?`, 'gi'), character.toUpperCase());
        });
    }

    return text;
}

// value fix before
function valueFixBefore(text) {
    const values = text.match(/\d+((,\d{3})+)?(\.\d+)?/gi);
    let valueTable = [];

    if (values) {
        for (let index = 0; index < values.length; index++) {
            const element = values[index];
            if (element.includes(',')) {
                const element2 = element.replaceAll(',', '');
                text = text.replaceAll(element, element2);
                valueTable.push([element2, element]);
            }
        }
    }

    return {
        text: text,
        table: sortArray(valueTable),
    };
}

// value fix after
function valueFixAfter(text, valueTable) {
    for (let index = 0; index < valueTable.length; index++) {
        const element = valueTable[index];
        text = text.replaceAll(element[0], element[1]);
    }

    return text;
}

// read json
function readJSON(path = '', name = '', needSub = false, sub0 = 0, sub1 = 1) {
    // get path
    const jsonPath = path.includes(':') ? fileModule.getPath(path, name) : fileModule.getRootPath('src', 'json', path, name);

    try {
        // read
        let array = fileModule.read(jsonPath, 'json');

        // type check
        if (!Array.isArray(array)) {
            throw `${path}/${name} is not an array.`;
        }

        // sub array
        if (needSub) {
            array = subArray(array, sub0, sub1);
        }

        // remove comment and N/A
        array = clearArray(array);

        // sort
        if (name != 'chTemp.json') {
            array = sortArray(array);
        }

        // log array
        // console.log(`Read ${jsonPath}. (length: ${array.length})`);

        return array;
    } catch (error) {
        console.log(error);
        fileModule.write(jsonPath, [], 'json');
        return [];
    }
}

// read json main
function readJSONMain(sub0, sub1) {
    try {
        const fileList = readdirSync('./src/json/text/main');
        let mainArray = [];

        if (fileList.length > 0) {
            fileList.forEach((value) => {
                if (value !== 'hidden.json') {
                    mainArray = mainArray.concat(readJSON('text/main', value, true, sub0, sub1));
                }
            });
        }

        mainArray = sortArray(mainArray);
        return mainArray;
    } catch (error) {
        console.log(error);
        return [];
    }
}

// read json overwrite
function readJSONOverwrite(ch, directory) {
    try {
        const fileList = readdirSync(`./src/json/${ch}/${directory}`);
        let overwrite = [];

        if (fileList.length > 0) {
            fileList.forEach((value) => {
                if (value !== 'hidden.json') {
                    overwrite = overwrite.concat(readJSON(`${ch}/${directory}`, value));
                }
            });
        }

        overwrite = sortArray(overwrite);
        return overwrite;
    } catch (error) {
        console.log(error);
        return [];
    }
}

// read json subtitle
function readJSONSubtitle() {
    try {
        const fileList = readdirSync('./src/json/text/jp/subtitle');
        let subtitle = [];

        if (fileList.length > 0) {
            fileList.forEach((value) => {
                if (value !== 'hidden.json') {
                    subtitle = subtitle.concat(readJSON('text/jp/subtitle', value));
                }
            });
        }

        subtitle = sortArray(subtitle);
        return subtitle;
    } catch (error) {
        console.log(error);
        return [];
    }
}

// sub array
function subArray(array, sub0, sub1) {
    if (!Array.isArray(array)) {
        return [];
    }

    if (!array.length > 0) {
        return [];
    }

    array.forEach((value, index, array) => {
        array[index] = [value[sub0], value[sub1]];
    });

    return array;
}

// clear array
function clearArray(array) {
    if (!Array.isArray(array)) {
        return [];
    }

    if (!array.length > 0) {
        return [];
    }

    if (Array.isArray(array[0])) {
        // 2d
        for (let index = array.length - 1; index >= 0; index--) {
            const element = array[index];

            if (element[0].includes('//comment') || element[0] === '' || element[0] === 'N/A' || element[1] === 'N/A') {
                array.splice(index, 1);
            }
        }
    } else {
        // not 2d
        for (let index = array.length - 1; index >= 0; index--) {
            const element = array[index];
            if (element.includes('//comment') || element === '' || element === 'N/A') {
                array.splice(index, 1);
            }
        }
    }

    return array;
}

// sort array
function sortArray(array) {
    if (!Array.isArray(array)) {
        return [];
    }

    if (!array.length > 0) {
        return [];
    }

    if (Array.isArray(array[0])) {
        // 2d
        return array.sort((a, b) => b[0].length - a[0].length);
    } else {
        // not 2d
        return array.sort((a, b) => b.length - a.length);
    }
}

// combine array
function combineArray(...args) {
    return sortArray([].concat(...args));
}

// combine array with temp
function combineArrayWithTemp(temp, ...args) {
    // ignore index
    let tempIgnoreIndex = [];
    let combineIgnoreIndex = [];

    // combine array
    let combine = combineArray(...args);

    // search same name and delete it
    const combine0 = combine.map((x) => x[0]);
    temp.forEach((tempElement, tempIndex) => {
        const targetIndex1 = combine0.indexOf(tempElement[0]);
        const targetIndex2 = combine0.indexOf(tempElement[0] + '#');

        // delete name
        if (targetIndex1 >= 0) {
            if (tempElement[2] === 'temp') {
                // from temp
                if (!tempIgnoreIndex.includes(tempIndex)) tempIgnoreIndex.push(tempIndex);
            } else {
                // from combine
                if (!combineIgnoreIndex.includes(targetIndex1)) combineIgnoreIndex.push(targetIndex1);
            }
        }

        // delete name#
        if (targetIndex2 >= 0) {
            if (tempElement[2] === 'temp') {
                // from temp
                if (!tempIgnoreIndex.includes(tempIndex)) tempIgnoreIndex.push(tempIndex);
            } else {
                // from combine
                if (!combineIgnoreIndex.includes(targetIndex2)) combineIgnoreIndex.push(targetIndex2);
            }
        }

        // delete name from temp which length < 3
        if (tempElement[0].length === 1 || (tempElement[0].length < 3 && allKana.test(tempElement[0]))) {
            if (!tempIgnoreIndex.includes(tempIndex)) tempIgnoreIndex.push(tempIndex);
        }
    });

    // delete name from temp
    if (tempIgnoreIndex.length > 0) {
        tempIgnoreIndex.sort((a, b) => b - a);
        for (let index = 0; index < tempIgnoreIndex.length; index++) {
            const element = tempIgnoreIndex[index];
            temp.splice(element, 1);
        }

        // update temp
        fileModule.write(fileModule.getPath(fileModule.getUserDataPath('temp'), 'chTemp.json'), temp, 'json');
    }

    // delete name from combine
    if (combineIgnoreIndex.length > 0) {
        combineIgnoreIndex.sort((a, b) => b - a);
        for (let index = 0; index < combineIgnoreIndex.length; index++) {
            const element = combineIgnoreIndex[index];
            combine.splice(element, 1);
        }
    }

    // sub temp
    temp = temp.map((x) => [x[0], x[1]]);

    return combineArray(temp, combine);
}

// module exports
module.exports = {
    skipCheck,
    replaceText,
    includesArrayItem,
    sameAsArrayItem,
    markFix,
    clearCode,
    valueFixBefore,
    valueFixAfter,

    readJSON,
    readJSONMain,
    readJSONOverwrite,
    readJSONSubtitle,
    combineArray,
    combineArrayWithTemp,
};