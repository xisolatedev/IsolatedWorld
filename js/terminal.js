
class Terminal {
    constructor(element) {
        this.element = element;
        this.history = [];
        this.historyIndex = 0;

        this.files = {
            "about.txt": "IsoDev — developer, builder, explorer.",
            "mission.txt": "Keep learning. Keep building.",
            "contact.txt": "Find me through IsolatedWorld.",
        };

        this.projects = {
            satarengine: "A web-native multiplayer game engine and creator platform.",
            isovr: "A custom Android VR ecosystem with 6DoF tracking.",
            novex: "An autonomous multi-drone platform.",
            "reality-engine": "An experimental physics-based simulation engine."
        };

        this.commands = {
            help: () => this.help(),
            clear: () => this.clear(),
            whoami: () => this.print("IsoDev / builder / explorer"),
            pwd: () => this.print("/home/isodev"),
            ls: (args) => this.list(args),
            cat: (args) => this.cat(args),
            echo: (args) => this.print(args.join(" ")),
            date: () => this.print(new Date().toString()),
            projects: () => this.showProjects(),
            neofetch: () => this.neofetch(),
            history: () => this.showHistory(),
            open: (args) => this.openProject(args),
        };

        this.initialize();
    }

    initialize() {
        this.element.innerHTML = "";
        this.element.classList.add("interactive-terminal");

        this.output = document.createElement("div");
        this.output.className = "terminal-output-area";

        this.inputLine = document.createElement("div");
        this.inputLine.className = "terminal-input-line";

        this.prompt = document.createElement("span");
        this.prompt.className = "terminal-prompt";
        this.prompt.textContent = "$";

        this.input = document.createElement("input");
        this.input.className = "terminal-input";
        this.input.type = "text";
        this.input.autocomplete = "off";
        this.input.spellcheck = false;
        this.input.setAttribute("aria-label", "Terminal command");

        this.inputLine.append(this.prompt, this.input);
        this.element.append(this.output, this.inputLine);

        this.input.addEventListener("keydown", (event) => {
            this.handleKey(event);
        });

        this.element.addEventListener("click", () => {
            this.input.focus();
        });

        this.print("IsolatedWorld Terminal v1.0");
        this.print("Welcome, explorer.");
        this.print("");

        this.execute("help");
    }

    print(message = "", className = "") {
        const line = document.createElement("div");
        line.className = "terminal-line";

        if (className) {
            line.classList.add(className);
        }

        line.textContent = message;
        this.output.appendChild(line);

        this.element.scrollTop = this.element.scrollHeight;
    }

    execute(commandLine) {
        const text = commandLine.trim();

        if (!text) return;

        this.print("$ " + text, "terminal-command");

        this.history.push(text);
        this.historyIndex = this.history.length;

        const parts = text.split(/\s+/);
        const command = parts.shift().toLowerCase();

        if (this.commands[command]) {
            this.commands[command](parts);
        } else {
            this.print(
                `Command not found: ${command}. Type 'help'.`,
                "terminal-error"
            );
        }
    }

    handleKey(event) {
        if (event.key === "Enter") {
            const command = this.input.value;
            this.input.value = "";
            this.execute(command);
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            if (this.historyIndex > 0) {
                this.historyIndex--;
            }

            this.input.value = this.history[this.historyIndex] || "";
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            if (this.historyIndex < this.history.length) {
                this.historyIndex++;
            }

            this.input.value = this.history[this.historyIndex] || "";
        }

        if (event.key === "Tab") {
            event.preventDefault();
            this.autocomplete();
        }
    }

    autocomplete() {
        const text = this.input.value.toLowerCase();

        if (text.includes(" ")) return;

        const matches = Object.keys(this.commands).filter(
            command => command.startsWith(text)
        );

        if (matches.length === 1) {
            this.input.value = matches[0] + " ";
        }
    }

    help() {
        this.print("");
        this.print("AVAILABLE COMMANDS", "terminal-title");
        this.print("------------------------------");
        this.print("help       Show available commands");
        this.print("clear      Clear the terminal");
        this.print("whoami     Display user information");
        this.print("pwd        Show current directory");
        this.print("ls         List files and projects");
        this.print("cat        Read a text file");
        this.print("echo       Print a message");
        this.print("date       Display current date");
        this.print("projects   Explore my projects");
        this.print("open       Open a project website");
        this.print("neofetch   Display system information");
        this.print("history    Show command history");
        this.print("");
        this.print("TIP: Try 'cat mission.txt' or 'projects'.");
        this.print("");
    }

    clear() {
        this.output.innerHTML = "";
    }

    list(args) {
        const directory = args[0] || ".";

        if (directory === "." || directory === "~") {
            this.print("about.txt");
            this.print("mission.txt");
            this.print("contact.txt");
            this.print("worlds/");
            return;
        }

        if (directory === "worlds" || directory === "worlds/") {
            Object.keys(this.projects).forEach(name => {
                this.print(name + "/");
            });
            return;
        }

        this.print(`ls: cannot access '${directory}'`, "terminal-error");
    }

    cat(args) {
        const filename = args[0];

        if (!filename) {
            this.print("Usage: cat <filename>");
            return;
        }

        if (this.files[filename] !== undefined) {
            this.print(this.files[filename]);
        } else {
            this.print(`cat: ${filename}: No such file`, "terminal-error");
        }
    }

    showProjects() {
        this.print("");
        this.print("MY WORLDS", "terminal-title");

        for (const [name, description] of Object.entries(this.projects)) {
            this.print(`${name}/ — ${description}`);
        }

        this.print("");
    }

    openProject(args) {
        const project = args[0]?.toLowerCase();

        const links = {
            satarengine: "https://satarengine.com"
        };

        if (!project) {
            this.print("Usage: open <project>");
            return;
        }

        if (!links[project]) {
            this.print("No public URL configured for this project.");
            return;
        }

        this.print("Opening " + project + "...");
        window.open(links[project], "_blank", "noopener,noreferrer");
    }

    neofetch() {
        this.print("");
        this.print("       *       IsoDev@IsolatedWorld");
        this.print("      /|\\      --------------------");
        this.print("     / | \\     OS: IsolatedWorld");
        this.print("    /  |  \\    Shell: worldsh 1.0");
        this.print("   /___|___\\   Focus: Engineering");
        this.print("                Projects: " + Object.keys(this.projects).length);
        this.print("                Status: Building");
        this.print("");
    }

    showHistory() {
        this.history.forEach((command, index) => {
            this.print(`${index + 1}  ${command}`);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const terminalBody = document.querySelector(".terminal-body");

    if (terminalBody) {
        new Terminal(terminalBody);
    }
});
