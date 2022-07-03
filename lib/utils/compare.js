"use babel";

module.exports = {
    compare,
};

function compare(objA, objB) {
    return JSON.stringify(objA) === JSON.stringify(objB);
}
