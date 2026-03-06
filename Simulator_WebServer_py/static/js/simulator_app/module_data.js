// data.js - 模块数据定义

/**
 * S1_16DI_ModuleData - 16通道数字量输入模块
 */
class S1_16DI_ModuleData {
    /**
     * @param {Object} options
     * @param {number} [options.ioType=1]
     * @param {number} [options.slot=1]
     * @param {number} [options.orderNumber=506101]
     * @param {number} [options.inputLength=2]
     * @param {number} [options.outputLength=0]
     * @param {Array} [options.parameters] 参数数组，默认一个参数 {filter:1, invertByte1:0, invertByte2:0}
     */
    constructor({
        ioType = 1,
        slot = 1,
        orderNumber = 506101,
        inputLength = 2,
        outputLength = 0,
        parameters = [{ filter: 1, invertByte1: 0, invertByte2: 0 }]
    } = {}) {
        this.ioType = ioType;
        this.slot = slot;
        this.orderNumber = orderNumber;
        this.inputLength = inputLength;
        this.outputLength = outputLength;
        this.parameters = parameters;
    }

    toObject() {
        return {
            ioType: this.ioType,
            slot: this.slot,
            orderNumber: this.orderNumber,
            inputLength: this.inputLength,
            outputLength: this.outputLength,
            parameters: this.parameters.map(p => ({
                filter: p.filter,
                invertByte1: p.invertByte1,
                invertByte2: p.invertByte2
            }))
        };
    }

    toJson(replacer = null, space = 2) {
        return JSON.stringify(this.toObject(), replacer, space);
    }

    static fromJson(json) {
        const obj = typeof json === 'string' ? JSON.parse(json) : json;
        return new S1_16DI_ModuleData(obj);
    }
}

/**
 * S1_16DO_ModuleData - 16通道数字量输出模块
 */
class S1_16DO_ModuleData {
    constructor({
        ioType = 2,
        slot = 2,
        orderNumber = 506102,
        inputLength = 0,
        outputLength = 2,
        parameters = [{ enableOutputPresetValue: 0, presentByte1: 0, presentByte2: 0 }]
    } = {}) {
        this.ioType = ioType;
        this.slot = slot;
        this.orderNumber = orderNumber;
        this.inputLength = inputLength;
        this.outputLength = outputLength;
        this.parameters = parameters;
    }

    toObject() {
        return {
            ioType: this.ioType,
            slot: this.slot,
            orderNumber: this.orderNumber,
            inputLength: this.inputLength,
            outputLength: this.outputLength,
            parameters: this.parameters.map(p => ({
                enableOutputPresetValue: p.enableOutputPresetValue,
                presentByte1: p.presentByte1,
                presentByte2: p.presentByte2
            }))
        };
    }

    toJson(replacer = null, space = 2) {
        return JSON.stringify(this.toObject(), replacer, space);
    }

    static fromJson(json) {
        const obj = typeof json === 'string' ? JSON.parse(json) : json;
        return new S1_16DO_ModuleData(obj);
    }
}

/**
 * S1_08AI_ModuleData - 8通道模拟量输入模块
 */
class S1_08AI_ModuleData {
    constructor({
        ioType = 12,
        slot = 4,
        orderNumber = 506112,
        inputLength = 18,
        outputLength = 0,
        parameters = Array(8).fill({ mode: 2, singleOrDifferential: 1, filter: 0 })
    } = {}) {
        this.ioType = ioType;
        this.slot = slot;
        this.orderNumber = orderNumber;
        this.inputLength = inputLength;
        this.outputLength = outputLength;
        this.parameters = parameters;
    }

    toObject() {
        return {
            ioType: this.ioType,
            slot: this.slot,
            orderNumber: this.orderNumber,
            inputLength: this.inputLength,
            outputLength: this.outputLength,
            parameters: this.parameters.map(p => ({
                mode: p.mode,
                singleOrDifferential: p.singleOrDifferential,
                filter: p.filter
            }))
        };
    }

    toJson(replacer = null, space = 2) {
        return JSON.stringify(this.toObject(), replacer, space);
    }

    static fromJson(json) {
        const obj = typeof json === 'string' ? JSON.parse(json) : json;
        return new S1_08AI_ModuleData(obj);
    }
}

/**
 * S1_08AO_ModuleData - 8通道模拟量输出模块
 */
class S1_08AO_ModuleData {
    constructor({
        ioType = 13,
        slot = 3,
        orderNumber = 506113,
        inputLength = 8,
        outputLength = 16,
        parameters = Array(8).fill({ mode: 1, range: 0, current: 0 })
    } = {}) {
        this.ioType = ioType;
        this.slot = slot;
        this.orderNumber = orderNumber;
        this.inputLength = inputLength;
        this.outputLength = outputLength;
        this.parameters = parameters;
    }

    toObject() {
        return {
            ioType: this.ioType,
            slot: this.slot,
            orderNumber: this.orderNumber,
            inputLength: this.inputLength,
            outputLength: this.outputLength,
            parameters: this.parameters.map(p => ({
                mode: p.mode,
                range: p.range,
                current: p.current
            }))
        };
    }

    toJson(replacer = null, space = 2) {
        return JSON.stringify(this.toObject(), replacer, space);
    }

    static fromJson(json) {
        const obj = typeof json === 'string' ? JSON.parse(json) : json;
        return new S1_08AO_ModuleData(obj);
    }
}

// 暴露到全局，以便在 management.js 中使用
//window.S1_16DI_ModuleData = S1_16DI_ModuleData;
//window.S1_16DO_ModuleData = S1_16DO_ModuleData;
//window.S1_08AI_ModuleData = S1_08AI_ModuleData;
//window.S1_08AO_ModuleData = S1_08AO_ModuleData;