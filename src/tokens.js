
const TokenType = {
    OPERATOR: 0,
    TAG: 1,
};


class Token{

    constructor(startIndex, endIndex, value, type) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.value = value;
        this.type = type;
    }

    getStartIndex() {
        return this.startIndex;
    }

    getEndIndex() {
        return this.endIndex;
    }

    getValue() {
        return this.value;
    }

    getType() {
        return this.type;
    }
}

module.exports = {
    Token,
    TokenType: TokenType,
};