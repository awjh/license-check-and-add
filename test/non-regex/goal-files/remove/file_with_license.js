
function printAlpha (message) {
    const alphabet = [' ', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

    let string = '';

    for (let i = 0; i < message.length; i++) {
        for (let j = 0; j < alphabet.length; j++) {
            if (message[i] - j === 0) {
                string = string + alphabet[j];
            }
        }
    }

    return string;
}
 
console.log(printAlpha([8, 5, 12, 12, 15, 0, 23, 15, 18, 12, 4]));