'use strict';

// 測試中

const {
    languageTable,
    engineList,
    baiduTable,
    caiyunTable,
    youdaoTable,
    googleTable,
    getTableValue
} = require('./translator/language-table');

const baidu = require('./translator/baidu');
const caiyun = require('./translator/caiyun');
const youdao = require('./translator/youdao');
const google = require('./translator/google');

async function translate(text, translation, table = []) {
    const engine = translation.engine;
    const languageFrom = translation.from;
    const languageTo = translation.to;
    const autoChange = translation.autoChange;

    // set input
    let input = {
        text: text,
        from: languageFrom,
        to: languageTo
    };

    let translatedText = '';
    let retryCount = 0;
    let missingCodes = [];

    do {
        input.text = fixCode(input.text, missingCodes);
        translatedText = await selectEngine(engine, input);
        retryCount++;

        // auto change
        if (translatedText === '') {
            console.log('Response is empty.');

            if (autoChange) {
                for (let index = 0; index < engineList.length; index++) {
                    const element = engineList[index];

                    if (element !== engine) {
                        console.log(`Use ${element}.`);

                        translatedText = await selectEngine(element, input);
                        if (translatedText !== '') {
                            break;
                        }
                    }
                }
            }
        }

        missingCodes = missingCodeCheck(translatedText, table);
    } while (missingCodes.length > 0 && retryCount < 3);

    return await zhtConvert(translatedText, languageTo);
}

async function selectEngine(engine, input) {
    let translatedText = '';

    switch (engine) {
        case 'Baidu':
            translatedText = await baidu.translate(input.text, getTableValue(input.from, baiduTable), getTableValue(input.to, baiduTable));
            break;

        case 'Caiyun':
            translatedText = await caiyun.translate(input.text, getTableValue(input.from, caiyunTable), getTableValue(input.to, caiyunTable));
            break;

        case 'Youdao':
            translatedText = await youdao.translate(input.text, getTableValue(input.from, youdaoTable), getTableValue(input.to, youdaoTable));
            break;

        case 'Google':
            translatedText = await google.translate(input.text, getTableValue(input.from, googleTable), getTableValue(input.to, googleTable));
            break;

        default:
            translatedText = await baidu.translate(input.text, getTableValue(input.from, baiduTable), getTableValue(input.to, baiduTable));
    }

    return translatedText;
}

async function zhtConvert(text, languageTo) {
    if (languageTo === languageTable.zht && text !== '') {
        const response = await google.translate(text, 'zh-CN', 'zh-TW');
        return response !== '' ? response : text;
    } else {
        return text;
    }
}

function missingCodeCheck(text, table) {
    let missingCodes = [];

    if (table.length > 0) {
        for (let index = 0; index < table.length; index++) {
            const code = table[index][0];
            if (!new RegExp(code, 'gi').test(text)) {
                missingCodes.push(code);
            }
        }
    }

    return missingCodes;
}

function fixCode(text, missingCodes) {
    if (missingCodes.length > 0) {
        for (let index = 0; index < missingCodes.length; index++) {
            const code = missingCodes[index][0];
            const codeRegExp = new RegExp(`(${code}+)`, 'gi');

            text = text.replace(codeRegExp, '$1' + code);
        }
    }

    return text;
}

exports.translate = translate;