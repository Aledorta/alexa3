/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = '!Bienvenido a ALIXED! jeje, el juego de adivinar la palabra que encadena tus respuestas, ¿estás listo?, si no sabes como se juega debes pedir ayuda antes de que empiece la partida.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const StartIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartIntent';
    },
    handle(handlerInput) {
        let clueText = '';
        if (currentStatus === 'Start') {
            clueText += startNewGame();
            questionsCount = 0;
            goodAnswers = [];
            currentStatus = 'Asking';
        } else {
            clueText += 'El juego ya ha empezado.';
        }
        const speakOutput  = clueText;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const ClueIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ClueIntent';
    },
    handle(handlerInput) {
    let speechText = '';
    if (currentStatus === 'Final') {
        speechText += `Pista : ${currentIndex.Clue}`;
    } else {
        speechText += 'Si no has respondido las 4 preguntas no podrá pedir pista, Además puede ser que no estes jugando aún, si no lo tienes claro, siempre puede reiniciar y pedir ayuda.';
    }
    const speakOutput = speechText;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const ChangeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ChangeIntent';
    },
    handle(handlerInput) {
        let speechText = "";
        if (currentStatus === 'Asking' || currentStatus === 'Playing'){
            if (currentIndex === null) {
                return 'Se acabaron las palabras';
            } else {
                if (changePerson === 0) {
                    currentIndex = null;
                    speechText = clueText;
                    changePerson++;
                    questionsCount = 0;
                    const clueText = startNewGame();
                } else {
                    speechText += 'No puedes cambiar de personaje, ya lo has hecho anteriormente...';
                }
            }
        } else {
            speechText += 'No puedes cambiar de personaje, no estas jugando';
        }
        const speakOutput = speechText;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


const AnswerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const sessionAttributes = attributesManager.getRequestAttributes();
        const userAnswer = handlerInput.requestEnvelope.request.intent.slots.answerSlot.value;
        const {intent} = handlerInput.requestEnvelope.request;
        let speechText = '';
        if (currentStatus === 'Final') {
            if (currentIndex.Theanswer === userAnswer) {
                speechText += '¡Correcto! Has adivinado la palabra y conseguido la letra, '+ currentIndex.letter + ' ¿Quieres jugar otra vez?';
                winingLetters.push(currentIndex.letter);
                sessionAttributes['winingLetters'] = winingLetters;
                const letrasFaltan = letrasFaltantes();
                if (letrasFaltan.length > 0) {
                    speechText += ` Te faltan las siguientes letras: ${letrasFaltan.join(', ')}.`;
                } else {
                    speechText = '¡Has adivinado todas las letras, Felicidades!';
                    const speakOutput = speechText;
                    return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .getResponse();
                }
                questionsCount = 0;
                good++;
            } else {
                speechText += 'Incorrecto. La respuesta era ' + currentIndex.Theanswer + ' ¿Quieres jugar otra vez?';
                const letrasFaltan = letrasFaltantes();
                if (letrasFaltan.length > 0) {
                    speechText += ` Te faltan las siguientes letras: ${letrasFaltan.join(', ')}.`;
                }
                currentIndex = null;
                countPers = 0;
                winingLetters = [];
                good = 0;
                goodAnswers = [];
                questionsCount = 0;
                changePerson = 0;
                questionsCount = 0;
            }
        }
        if (currentStatus === 'Asking' && currentStatus!== 'Final') {
            if (currentIndex.Answers[questionsCount] === userAnswer) {
                questionsCount++;
                if (questionsCount === 4) {
                    goodAnswers.push(userAnswer);
                    speechText += 'Respuesta correcta. Has dado las siguientes respuestas: ' + goodAnswers.join(', ') + ', puedes pedir una pista';
                    currentStatus = 'Final';
                } else {
                    speechText += '¡Bien! la respuesta es correcta. ¿Quieres la siguiente pregunta?';
                    goodAnswers.push(userAnswer);
                    currentStatus = 'Playing';
                }
            } else {
                questionsCount++;
                if (questionsCount === 4 ) {
                    if (goodAnswers.length > 0) {
                        speechText += 'Respuesta incorrecta. Has dado las siguientes respuestas: ' + goodAnswers.join(', ') + ', puedes pedir una pista';
                        currentStatus = 'Final';
                    } else {
                        speechText += 'Respuesta incorrecta. No has acertado ninguna de las preguntas, aún así puedes pedir una pista. ';
                    }
                } else {
                    speechText += 'La respuesta es incorrecta. ¿Quieres la siguiente pregunta?';
                    currentStatus = 'Playing';
                }
            }
        }
        
        const speakOutput = speechText;
        return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(speakOutput)
        .getResponse();
    }
};

const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        let clueText = '';
        if (currentStatus === 'Playing' ) {
            if  (questionsCount > 4) {
            clueText += 'No quedan más preguntas, debes responder a la final.';
            } else {
                clueText +=  `Pregunta ${questionsCount + 1} : ${currentIndex.Questions[questionsCount]}`;
                currentStatus = 'Asking';
            }
        } else if (currentStatus === 'Final') {
            currentIndex = null;
            clueText += startNewGame();
            questionsCount = 0;
            goodAnswers = [];
            currentStatus = 'Asking';
        } else if (currentStatus === 'Start') {
            clueText += startNewGame();
            questionsCount = 0;
            goodAnswers = [];
            currentStatus = 'Asking';
        } else {
            clueText += 'revisa las instrucciones para saber como se juega.';
        }
        const speakOutput  = clueText;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        let speechText = '';
        if(currentStatus === 'Start'){
            speechText += 'Para responder una pregunta o la palabra final que las engloba, debemos de decir "es" o "la respuesta es" antes de decir la dicha respuesta que solo será de una palabra,';
            speechText += 'cada palabra tendrá una letra asociada, el objetivo del juego es conseguir formar la palabra ALIXED, solo pudiendo cambiar de preguntas una única vez "siguiente letra", "otra palabra", etc.';
            speechText += '¿Estas listo?.';
        } else {
            speechText += 'Una vez empezado el juego no se podrá pedir ayuda.';
        }
        
        const speakOutput  = speechText;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
     
        const speakOutput = 'Juego finalizado, conseguiste ' + winingLetters.join(', ') + ' Letras y acertaste ' + good + ' de ' + countPers + ' intentos.';
    
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Lo siento eso no está en mi repertorio.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        currentIndex = null;
        countPers = 0;
        winingLetters = [];
        good = 0;
        goodAnswers = [];
        questionsCount = 0;
        currentStatus = 'Start';
        changePerson = 0;
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};


const linkeds = require('./Questions-list');
const gameLetters = ['A','L','I','X','E','D'];
var currentIndex = null;
var countPers = 0;
var winingLetters = [];
var good = 0;
var goodAnswers = [];
var questionsCount = 0;
var currentStatus = 'Start';
var changePerson = 0;

function getRandomItem(obj) {
    if (Object.keys(obj).length === 0) {
        return null;
    }
    currentIndex = obj[Object.keys(obj)[Math.floor(Math.random()*Object.keys(obj).length)]];
    return currentIndex;
}

function letrasFaltantes() {
    const faltantes = gameLetters.filter(letra => !winingLetters.includes(letra));
    return faltantes;
}

function startNewGame() {
    
    let speechText = '';
    
        speechText = getRandomItem(linkeds);
        if (currentIndex === null){
            return 'No quedan más personajes sin responder. Has acertado ' + good + ' de ' + countPers + ' y has conseguido ' + winingLetters.join(', ') + ' Letras. '; 
        }
        delete linkeds[currentIndex.id];
        countPers++;
        const speakOutput = `Pregunta ${questionsCount + 1} : ${currentIndex.Questions[questionsCount]}`;
        currentStatus = 'Preguntando';
        return speakOutput
    
}

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        StartIntentHandler,
        ClueIntentHandler,
        ChangeIntentHandler,
        AnswerIntentHandler,
        YesIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();