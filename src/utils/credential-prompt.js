const readline = require('readline');

class CredentialPrompt {
    constructor() {
        this.rl = null;
    }

    /**
     * Create readline interface
     */
    createInterface() {
        if (!this.rl) {
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        }
        return this.rl;
    }

    /**
     * Prompt for username
     * @param {string} defaultUsername - Default username to show
     * @returns {Promise<string>} Username
     */
    async promptUsername(defaultUsername = '') {
        const rl = this.createInterface();
        
        return new Promise((resolve) => {
            const prompt = defaultUsername 
                ? `Username/Email (${defaultUsername}): `
                : 'Username/Email: ';
                
            rl.question(prompt, (answer) => {
                resolve(answer.trim() || defaultUsername);
            });
        });
    }

    /**
     * Prompt for password (hidden input)
     * @returns {Promise<string>} Password
     */
    async promptPassword() {
        const rl = this.createInterface();
        
        return new Promise((resolve) => {
            // Hide password input
            const stdin = process.stdin;
            stdin.setRawMode(true);
            stdin.resume();
            stdin.setEncoding('utf8');

            let password = '';
            console.log('Password: ');

            const onData = (char) => {
                switch (char) {
                    case '\n':
                    case '\r':
                    case '\u0004': // Ctrl+D
                        stdin.setRawMode(false);
                        stdin.pause();
                        stdin.removeListener('data', onData);
                        console.log(''); // New line
                        resolve(password);
                        break;
                    case '\u0003': // Ctrl+C
                        stdin.setRawMode(false);
                        stdin.pause();
                        stdin.removeListener('data', onData);
                        process.exit();
                        break;
                    case '\u007f': // Backspace
                        if (password.length > 0) {
                            password = password.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                        break;
                    default:
                        password += char;
                        process.stdout.write('*');
                        break;
                }
            };

            stdin.on('data', onData);
        });
    }

    /**
     * Prompt for both username and password
     * @param {string} defaultUsername - Default username
     * @returns {Promise<Object>} Credentials object
     */
    async promptCredentials(defaultUsername = '') {
        try {
            console.log('\n🔐 Enter your Threads/Instagram credentials:');
            
            const username = await this.promptUsername(defaultUsername);
            if (!username) {
                throw new Error('Username is required');
            }

            const password = await this.promptPassword();
            if (!password) {
                throw new Error('Password is required');
            }

            return { username, password };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Ask a simple yes/no question
     * @param {string} question - Question to ask
     * @returns {Promise<boolean>} Answer
     */
    async promptYesNo(question) {
        const rl = this.createInterface();
        
        return new Promise((resolve) => {
            rl.question(`${question} (y/N): `, (answer) => {
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });
    }

    /**
     * Close readline interface
     */
    close() {
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
    }
}

module.exports = CredentialPrompt;
