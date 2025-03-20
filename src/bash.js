import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import './bash.css';

const commandPrompt = "zgunther@my-laptop:~$ ";
const origText = "Hi, I'm Zack Gunther\n\nI'm a Software Engineer working at Tesla.\n\nWelcome to my website where I showcase some of the projects I've worked on!\n\n\nplease press enter\n" + commandPrompt;

function smile(args)
{
    if (args.length > 1)
    {
        switch (args[1])
        {
            case "small":
                return ":)";
            case "medium":
                return "¯\_(ツ)_/¯";
            case "large":
                return `
                    /#######\\
                    |_______|
                    |_ 0 0 _|
                    | \\___/ |
                    \\_______/
                    `;
            default:
                return "error - unknown argument '"+args[1]+"'. Type 'help' for use.";

        }
    }
    return ":)";
}
function ls(args)
{
    return "\n code.py\n moreCode.cpp\n evenMoreCode.js\n ahhhTooMuchCode.hs\n oooooLookASchematic.png\n";
}
function mkdir(args)
{
    let o = "So you are trying to make a folder? I'm sorry but I don't have time to implement a file system, nor the money to buy a server...";
    if (args.length < 2)
    {
        o += " Also, you didn't include a name for the directory or any arguments. I don't know what you want from me...";
    }
    return o;
}
function info(args)
{
    return "\nHello! I started writing this script at ~3 am during finals, senior fall, 2022. It is now 5:14 am, and I need to get back to studying. Hope you enjoyed this!\n";
}

// Add cd function
function cd(args, navigate) {
    if (args.length < 2) {
        return "error: please specify a path. Type 'help' for usage";
    }
    
    const path = args[1].startsWith('/') ? args[1] : '/' + args[1];
    navigate(path);
    return `navigating to ${path}...`;
}

function Bash() {
    const [completeText, setCompleteText] = useState(origText);
    const [textWritten, setTextWritten] = useState("");
    const navigate = useNavigate();
    const bashRef = useRef(null);

    const scrollToBottom = () => {
        if (bashRef.current) {
            bashRef.current.scrollTop = bashRef.current.scrollHeight;
        }
    };

    useEffect(() => {
            
        function handleInput(e) {
            console.log(e);

            if (String(e.key).length === 1 || e.code.toLowerCase() === "space") {
                setCompleteText(completeText + e.key);
                if (e.code.toLowerCase() === "space") {
                    e.preventDefault();
                }
            } else {
                if (e.key === "Enter") {
                    let text = completeText;
                    text += "\n";
                    let command = completeText.split("\n");
                    command = command[command.length - 1];
                    command = command.split(" ");
                    command = command.slice(1);
                    console.log(command[0] == "smile");
                    switch(command[0])
                    {
                        case "": break;
                        case "ls": text += ls(command); break;
                        case "clear": text = origText; break;
                        case "smile": text += smile(command); break;
                        case "mkdir": text += mkdir(command); break;
                        case "info": text += info(command); break;
                        case "cd": text += cd(command, navigate); break;
                        case "help": 
                            text += `
                            - smile <size> -- - prints a smiley face to the terminal, sizes=small,medium,large
                            - ls -- - - - - - - prints contents of my dev folder
                            - clear - - - - - - clears terminal
                            - mkdir - - - - - - creates a new folder
                            - cd <page> - - - - navigate to a different page
                            - info -- - - - - - lists info about this coding exercise\n`;
                            break;
                        default: text += "unknown command: '" + command + "'. Type 'help' to see available commands."; break;
                    }
                    text += "\n" + commandPrompt;
                    command = "";
                    setCompleteText(text);
                } else if (e.key === "Backspace" || e.code.toLowerCase() === "backspace") {
                    if (completeText.endsWith(commandPrompt)) {
                        // don't let it be removed
                    } else {
                        setCompleteText(completeText.slice(0, completeText.length - 1));
                    }
                } else if (e.key === "Escape") {
                    // pass
                }
            }

            //If someone typed, add to command
            return;
        }
        window.addEventListener("keydown", handleInput);
        return () => {
            window.removeEventListener("keydown", handleInput);
        }
    }, [completeText, navigate]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (textWritten.length > 0 && textWritten.length <= completeText.length && textWritten !== completeText.slice(0, textWritten.length)) {
                setTextWritten(textWritten.slice(0, textWritten.length - 1));
                scrollToBottom();
            } else {
                if (completeText.length > textWritten.length) {
                    if (completeText.length - textWritten.length > 5) {
                        setTextWritten(textWritten + completeText.slice(textWritten.length, textWritten.length + 5));
                    } else {
                        setTextWritten(textWritten + completeText[textWritten.length]);
                    }
                    scrollToBottom();
                } else if (completeText.length < textWritten.length) {
                    if (textWritten.length > 5) {
                        setTextWritten(textWritten.slice(0, textWritten.length - 5));
                    } else {
                        setTextWritten(textWritten.slice(0, textWritten.length - 1));
                    }
                    scrollToBottom();
                }
            }
        }, 10);
        return () => clearInterval(interval);
    }, [completeText, textWritten]);

    return (
        <div className="bash-container" ref={bashRef}>
            <div className="bash-content">
                {textWritten.split("\n").map((item, index) => (
                    <div key={index}>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    )
}
export { Bash };
