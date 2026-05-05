import dotenv from "dotenv" 
import {exec } from "child_process" 

dotenv.config() 

let system_configuration= ` 
    You are an AI Assistant who takes input from the CLI and forms actions from the natural language and executes commands step by step in a procedural manner. 

    You work on INPUT, THINK, TOOL, OBSERVE and OUTPUT format. 

    You must break the task in steps and perform the task in multiple steps. You should avoid performing the task in a single step, and give good reasoning 
    for why you performed a particular action, at every step. 

    You will have access to a set of tools with the help of which you are to perform the tasks given to you. 

    You must return your responses in JSON format. 

    Every response given by the model will be parsed using JSON.parse(), it must not give any error, and this JSON object will be passed again to the model for performing next set of actions. 

    TOOLS: 

    executeCommandOnCLI(command ): This function takes a command to be executed on the terminal and executes it, and also returns a proper response in case an error occurs. 

    RULES: 

    1. You must always return a single response in standard JSON Format. You must return it in only and in only JSON format, not in Plain Text, or markdown format or multiple JSON Objects in one response, it should be in one JSON Object Format completely. 

    2. You should perform multi step thinking before proceeding with an action to execute. 

    3. You must wait for the previous step to be finished, before proceeding with the next step. 

    4. After every TOOL step, you must wait for the response from the OBSERVE step, and then continue with the next set of actions to be performed. 

    5. Use only Single Quotes (') and escape Characters for highlighting Strings in a String, JSON Format inside JSON Format or using Special characters when needed, avoid use of Double Quotes, and return the response in the exact format shown in Examples here. 

    6. You must strictly use these sequence of steps to perform the tasks given: INPUT => THINK => TOOL => OBSERVE => THINK => OUTPUT. You must not jump back to any of the previous step like from "THINK" => "INPUT" or from "TOOL" => "THINK" or "INPUT". You can iterate over the current step for processing data like from "THINk" => "THINK". 

    7. Do not repeat a task, no matter what. "THINK" carefully multiple times in what sequence of steps you will execute the task in the required format, then structure the commands in multiple "THINK" steps if required before executing it in "TOOL" step, such that it does not lead to execution of redundant commands. 

    8. Once all the tasks are completed, you must return with "OUTPUT" step, and with a good response in the "content". 

    OUTPUT Format: 

    {"step": "INPUT" | "THINK" | "TOOL" | "OBSERVE" | "OUTPUT", "content": string, "tool_name": string, "tool_args": string } 

    EXAMPLES: 

    user: "Please print "Hello Friend" on the screen". 

    assistant: ${`{"step": "INPUT", "content": "User wants 'Hello Friend' to be printed on the CLI Terminal on the screen" }` } 

    assistant: ${`{"step": "THINK", "content": "Do I have the tools required to perform the particular task?" }` } 

    assistant: ${`{"step": "THINK", "content": "Yes, I have 'executeCommandOnCLI' tool to perform the task and I will pass echo 'Hello Friend' as the command in the tool" }` } 

    assistant: ${`{"step": "TOOL", "tool_name": "executeCommandOnCLI", "tool_args": "echo "Hello Friend"" }` } 

    assistant: ${`{"step": "OBSERVE", "content": "Hello Friend" }` } 

    assistant: ${`{"step": "THINK", "content": "I have received the required response, what is the next step that I need to perform?" }` } 

    assistant: ${`{"step": "THINK", "content": "It seems that all the steps have been performed thoroughly, and the task in completed." }` } 

    assistant: ${`{"step": "OUPUT", "content": "\"Hello Friend\" has been successfully printed on the CLI Terminal on Screen" }` } 

` 

async function executeCommandOnCLI(command ) 
{ 
    return new Promise((resolve, reject )=> 
    { 
        
        exec(command, (error, stdout, stderr )=> 
        { 
            if(error ) 
            { 
                resolve(error ) 
            } 
            else if(stderr ) 
            { 
                resolve(stderr ) 
            } 
            else 
            { 
                resolve(stdout ) 
            } 
        } ) 
    } ) 
} 

const tools= 
{ 
    "executeCommandOnCLI": executeCommandOnCLI 
} 

let message= 
[ { 
    role: "system", 
    content: system_configuration 
}, 
{ 
    role: "user", 
    content: `Can you please clone the Scaler Academy website by creating a new Directory Called scaler_clone and inside it generate HTML, CSS, and JavaScript that results in fully working webpage. The output must include:
1. Header
2. Hero Section
3. Footer
The generated files must open in a browser and visually resemble the Scaler website. ` 
} ] 

async function main() 
{ 
    const response= await fetch("https://openrouter.ai/api/v1/chat/completions", 
        { 
            method: "POST", 
            headers: 
            { 
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                'Content-Type': "application/json" 
            }, 
            body: (JSON.stringify( 
                { 
                    model: process.env.MODEL, 
                    messages: message 
                } 
            ) ) 
        } ) 

    const oneResponse= await response.text().then((data )=> {/* console.log(JSON.parse(data ) ) ; */ return (JSON.parse(data ).choices[0].message.content ) } ) 
    /* console.log(oneResponse ) */ 
    /* const parsedResponse= (JSON.parse(oneResponse.slice(oneResponse.indexOf("{" ), (oneResponse.indexOf("}" )+ 1 ) ) ) ) */ 
    /* console.log(oneResponse ) */ 
    const parsedResponse= (JSON.parse(oneResponse ) ) 

    if(parsedResponse["step" ]=== "INPUT" ) 
    { 
        console.log("Model is processing INPUT... " ) 
        console.log(parsedResponse["content" ]+ '\n' ) 
    } 
    else if(parsedResponse["step" ]=== "THINK" ) 
    { 
        console.log("Model is THINKING... " ) 
        console.log(parsedResponse["content" ]+ '\n' ) 
    } 
    else if(parsedResponse["step" ]=== "TOOL" ) 
    { 
        console.log("Model is using TOOL "+ parsedResponse["tool_name" ]+ " with Arguments As "+ parsedResponse["tool_args" ]+ '\n' ) 
    } 
    else if(parsedResponse["step" ]=== "OBSERVE" ) 
    { 
        console.log("Model is OBSERVING the Response... " ) 
        console.log(parsedResponse["content" ]+ '\n' ) 
    } 
    else if(parsedResponse["step" ]=== "OUTPUT" ) 
    { 
        console.log("Model has given OUTPUT..." ) 
        console.log(parsedResponse["content" ]+ '\n' ) 
        return 
    } 
    if(parsedResponse["step" ]=== "INPUT" || parsedResponse["step" ]=== "THINK" ) 
    { 
        message.push( 
            { 
                role: "assistant", 
                content: (JSON.stringify(parsedResponse ) ) 
            } 
        ) 
    } 
    else if(parsedResponse["step" ]=== "TOOL" ) 
    { 
        const commandResponse= await tools[parsedResponse["tool_name" ] ](parsedResponse["tool_args" ] ).then((data )=> { return data } ) 
        const observeResponse= 
        { 
            step: "OBSERVE", 
            content: commandResponse 
        } 
        message.push( 
            { 
                role: "assistant", 
                content: (JSON.stringify(observeResponse ) ) 
            } 
        ) 
    } 
    await main() 
} 

main() 