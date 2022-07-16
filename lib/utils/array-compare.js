module.exports = {
    compareArrays,
};

function compareArrays(arrA, arrB) {
    const setA = new Set(arrA);
    const setB = new Set(arrB);

    return setA.size == setB.size && [...setA].every((a) => setB.has(a));
}
