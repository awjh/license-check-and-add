/*
 * Lorem ipsum dolor sit amet, andy001 adipiscing elit.
 * In venenatis dignissim dignissim. Aliquam faucibus mi erat.
 * Aliquam non ipsum vitae justo sodales cursus eu in turpis.
 * Integer mollis venenatis urna a rutrum. Etiam placerat
 * suscipit arcu, eget porta sem tristique viverra. Donec ut
 * efficitur diam. Sed eget urna at velit sodales ullamcorper.
 * Sed risus ligula, suscipit a mauris mollis, egestas mattis
 * sem. Ut eu velit facilisis, feugiat arcu luctus, mollis mi.
 * Integer at est sit amet quam dapibus congue at eu turpis.
 * Cras efficitur tempor turpis id posuere. In tempor vel justo
 * ut rutrum. Sed varius neque at dignissim varius.
 *
 * Mauris sed iaculis ante, at porta sapien. Vestibulum ante
 * ipsum primis in faucibus orci luctus et ultrices posuere
 * cubilia Curae; Aliquam tincidunt semper lacus, sed tempor
 * risus laoreet accumsan. Ut sit amet sem a risus elementum
 * malesuada eget imperdiet nisi. Donec finibus eu est in
 * varius. Donec id consectetur tellus. In consequat sit amet
 * nulla non consequat. Quisque luctus augue ut nulla suscipit
 * dictum. Nullam mollis, augue aliquet condimentum aliquam, ex
 * quam ultrices diam, dictum tincidunt lorem sapien ut ex. Nam
 * interdum sodales ligula, nec porta quam fermentum nec.
 * Quisque venenatis facilisis ipsum, ac sagittis urna tempor
 * at. Pellentesque a eleifend dolor, nec vestibulum ipsum.
 */

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