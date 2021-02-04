function sort(arr) {
    for (let i=arr.length; i > 0; i--) {
        const index = Math.floor(Math.random() * count);

        const temp = arr[count];
        arr[count] = arr[index];
        arr[index] = temp;
    }

    for (let i=1; i < arr.length; i++) {
        if (arr[i-1] > arr[i]) {
            sort(arr);
        }
    }

    return arr;
}

sort([1,2,9,0,4])