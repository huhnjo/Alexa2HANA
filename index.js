var request = require("request");

function url() {
    return "https://aemtesta08b28cc6.hana.ondemand.com/sap/aed/alexa/getInfoForAlexa.xsjs?PARAM=";
}

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

    // if (event.session.application.applicationId !== "") {
    //     context.fail("Invalid Application ID");
    //  }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {   //code executed when alexa skill starts/opens
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {    //code when it recognizes an intent
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {  //close alexa skill
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    var intent = intentRequest.intent
    var intentName = intentRequest.intent.name;

    if(intentName == "RevenueIntent"){
        request.get(url() + "TOTAL_SUM", function(error, response, body) {
            var response = JSON.parse(body);
            var revenue = response.TOTAL_REVENUE;
    
            var shouldEndSession = false;
            var header = "HanaHeader";
            var speechOutput = "We generated " + revenue + " dollar overall revenue this year!" ;
            var repromptText = "Thanks for asking me!";
    
            callback(session.attributes, buildSpeechletResponse(header,speechOutput,repromptText, shouldEndSession));
    
        });
        

    }else if(intentName == "RegionIntent"){
        request.get(url() + "BEST_REGION", function(error, response, body) {
            var response = JSON.parse(body);
            var country = response.COUNTRY;
            var revenue = response.REVENUE;
    
            var shouldEndSession = false;
            var header = "HanaHeader";
            var speechOutput = "The most successfull country this year with respect to generated revenue was " + country 
            + " with an overall Revenue stream of " + revenue + " dollar";
            var repromptText = "Thanks for asking me!";
    
            callback(session.attributes, buildSpeechletResponse(header,speechOutput,repromptText, shouldEndSession));
    
        });
        
    }else if(intentName == "ListIntent"){

        request.get(url() + "LIST_PER_REGION", function(error, response, body) {
            var response = JSON.parse(body);
        
            var speechOutput = "Here are your revenue streams per region: ";

            for(var item in response){
                var country = response[item].COUNTRY;
                var revenue = response[item].REVENUE;

                speechOutput += (country + " - " + revenue + " dollar, ");
            }
    
            var shouldEndSession = false;
            var header = "HanaHeader";
           
            var repromptText = "Thanks for asking me!";
    
            callback(session.attributes, buildSpeechletResponse(header,speechOutput,repromptText, shouldEndSession));
    
        });
    

    }else{
        throw "Invalid intent";
    }



    // dispatch custom intents to handlers here
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

}

// ------- Skill specific logic -------

function getWelcomeResponse(callback) {
    var speechOutput = "Welcome to the world of SAP! I can tell you some interesting facts about your HANA system!";
    var reprompt = "Thanks for asking me!";
    var header = "HanaHeader";

    var shouldEndSession = false;
    sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    }

    callback(sessionAttributes, buildSpeechletResponse(header,speechOutput, reprompt, shouldEndSession));
}

function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }
}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}


// ------- Helper functions to build responses for Alexa -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}