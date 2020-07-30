"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShaderEdge = exports.ShaderEdgeSlot = exports.ShaderSlot = exports.ShaderSlotType = exports.resetGlobalShaderSlotID = exports.ShaderNode = exports.ShaderPropery = void 0;
const utils_1 = require("./utils");
class ShaderPropery {
    constructor(obj) {
        this.type = {};
        this.data = {};
        this.name = '';
        this.type = obj.type;
        this.data = utils_1.getJsonObject(obj.JSONnodeData);
        this.name = this.data.m_Name;
        this.name = this.name.replace(/ /g, '_');
    }
    get defaultValue() {
        return this.data.m_Value;
    }
    get concretePrecision() {
        let concretePrecision = 1;
        let value = this.defaultValue;
        if (typeof value === 'object') {
            if (value.w !== undefined || value.r !== undefined) {
                concretePrecision = 4;
            }
            else if (value.z !== undefined || value.g !== undefined) {
                concretePrecision = 3;
            }
            else if (value.y !== undefined || value.b !== undefined) {
                concretePrecision = 2;
            }
        }
        return concretePrecision;
    }
}
exports.ShaderPropery = ShaderPropery;
class ShaderNode {
    // subgraphNode: SubGraphNode | null = null;
    constructor(data) {
        this.type = {};
        this.data = {};
        this.priority = 0;
        this.uuid = '';
        this.slots = [];
        this.slotsMap = new Map;
        this.deps = [];
        this.isMasterNode = false;
        this.fixedConcretePrecision = false;
        this.type = data.typeInfo;
        this.data = utils_1.getJsonObject(data.JSONnodeData);
        this.uuid = this.data.m_GuidSerialized;
        this.slots = this.data.m_SerializableSlots.map(d => {
            let slot = new ShaderSlot(d, this);
            this.slotsMap.set(slot.id, slot);
            return slot;
        });
    }
    addDependency(dep) {
        if (!this.deps.includes(dep)) {
            this.deps.push(dep);
        }
    }
    calcConcretePrecision() {
        if (!this.fixedConcretePrecision) {
            let minConcretePrecision = 999;
            this.inputSlots.forEach(slot => {
                let concretePrecision = slot.concretePrecision;
                if (slot.connectSlot) {
                    concretePrecision = slot.connectSlot.concretePrecision;
                }
                minConcretePrecision = Math.min(minConcretePrecision, concretePrecision);
            });
            this.slots.forEach(slot => {
                slot._concretePrecision = minConcretePrecision;
            });
        }
    }
    setPriority(priority) {
        this.priority = Math.max(priority, this.priority);
        for (let i = 0; i < this.deps.length; i++) {
            this.deps[i].setPriority(this.priority + 1);
        }
    }
    get outputSlots() {
        return this.slots.filter(s => s.type === ShaderSlotType.Output);
    }
    get inputSlots() {
        return this.slots.filter(s => s.type === ShaderSlotType.Input);
    }
    getSlotWithSlotName(name) {
        return this.slots.find(s => s.displayName === name);
    }
    getOutputSlotWithSlotName(name) {
        return this.outputSlots.find(s => s.displayName === name);
    }
    getOutputVarName(idx) {
        return this.outputSlots[idx].varName;
    }
    getOutputVarDefine(idx) {
        return this.outputSlots[idx].varDefine;
    }
    getInputValue(idx) {
        return this.inputSlots[idx].slotValue;
    }
    generateCode() {
        return '';
    }
}
exports.ShaderNode = ShaderNode;
let _GlobalShaderSlotID_ = 0;
function resetGlobalShaderSlotID() {
    _GlobalShaderSlotID_ = 0;
}
exports.resetGlobalShaderSlotID = resetGlobalShaderSlotID;
var ShaderSlotType;
(function (ShaderSlotType) {
    ShaderSlotType[ShaderSlotType["Input"] = 0] = "Input";
    ShaderSlotType[ShaderSlotType["Output"] = 1] = "Output";
})(ShaderSlotType = exports.ShaderSlotType || (exports.ShaderSlotType = {}));
class ShaderSlot {
    constructor(obj, node) {
        this.typeInfo = {};
        this.data = {};
        this.id = 0;
        this.globalID = 0;
        this.displayName = '';
        this.connectSlot = undefined;
        this.node = undefined;
        this.type = ShaderSlotType.Input;
        this._concretePrecision = -1;
        this.typeInfo = obj.typeInfo;
        this.data = utils_1.getJsonObject(obj.JSONnodeData);
        this.type = this.data.m_SlotType;
        this.node = node;
        this.id = this.data.m_Id;
        this.globalID = _GlobalShaderSlotID_++;
        this.displayName = this.data.m_DisplayName;
    }
    get varName() {
        return 'var_' + this.globalID;
    }
    get varDefine() {
        let precision = '';
        if (this.concretePrecision === 1) {
            precision = 'float';
        }
        else if (this.concretePrecision === 2) {
            precision = 'vec2';
        }
        else if (this.concretePrecision === 3) {
            precision = 'vec3';
        }
        else if (this.concretePrecision === 4) {
            precision = 'vec4';
        }
        if (precision) {
            precision += ' ';
        }
        return precision + this.varName;
    }
    get defaultValue() {
        let defaultValue = this.data.m_Value;
        let x = utils_1.getFloatString(defaultValue.x);
        let y = utils_1.getFloatString(defaultValue.y);
        let z = utils_1.getFloatString(defaultValue.z);
        let w = utils_1.getFloatString(defaultValue.w);
        let result = defaultValue;
        if (typeof defaultValue === 'object') {
            if (defaultValue.w !== undefined) {
                result = `vec4(${x}, ${y}, ${z}, ${w})`;
            }
            else if (defaultValue.z !== undefined) {
                result = `vec3(${x}, ${y}, ${z})`;
            }
            else if (defaultValue.y !== undefined) {
                result = `vec2(${x}, ${y})`;
            }
        }
        return result;
    }
    get slotValue() {
        var _a;
        let result;
        let valueConretePresition = this.defaultConcretePrecision;
        let defaultValue = this.data.m_Value;
        let x = utils_1.getFloatString(defaultValue.x);
        let y = utils_1.getFloatString(defaultValue.y);
        let z = utils_1.getFloatString(defaultValue.z);
        let w = utils_1.getFloatString(defaultValue.w);
        if (!this.connectSlot) {
            if ((_a = this.node) === null || _a === void 0 ? void 0 : _a.isMasterNode) {
                return null;
            }
            result = defaultValue;
            if (typeof defaultValue === 'object') {
                if (defaultValue.w !== undefined) {
                    result = `vec4(${x}, ${y}, ${z}, ${w})`;
                }
                else if (defaultValue.z !== undefined) {
                    result = `vec3(${x}, ${y}, ${z})`;
                }
                else if (defaultValue.y !== undefined) {
                    result = `vec2(${x}, ${y})`;
                }
            }
        }
        else {
            result = this.connectSlot.varName;
            valueConretePresition = this.connectSlot.concretePrecision;
        }
        if (this.concretePrecision !== valueConretePresition) {
            if (this.concretePrecision < valueConretePresition) {
                if (this.concretePrecision === 1) {
                    result += '.x';
                }
                else if (this.concretePrecision === 2) {
                    result += '.xy';
                }
                else if (this.concretePrecision === 3) {
                    result += '.xyz';
                }
            }
            else {
                let dif = this.concretePrecision - valueConretePresition;
                let str = '';
                if (dif === 1) {
                    str += `${x}`;
                }
                else if (dif === 2) {
                    str += `${x}, ${y}`;
                }
                else if (dif === 3) {
                    str += `${x}, ${y}, ${z}`;
                }
                if (this.concretePrecision === 2) {
                    result = `vec2(${result}, ${str});`;
                }
                else if (this.concretePrecision === 3) {
                    result = `vec3(${result}, ${str})`;
                }
                else if (this.concretePrecision === 4) {
                    result = `vec4(${result}, ${str})`;
                }
            }
        }
        return result;
    }
    get defaultConcretePrecision() {
        let concretePrecision = 1;
        let value = this.data.m_Value;
        if (typeof value === 'object') {
            if (value.w !== undefined) {
                concretePrecision = 4;
            }
            else if (value.z !== undefined) {
                concretePrecision = 3;
            }
            else if (value.y !== undefined) {
                concretePrecision = 2;
            }
        }
        return concretePrecision;
    }
    get concretePrecision() {
        if (this._concretePrecision === -1) {
            this._concretePrecision = 1;
            let value = this.data.m_Value;
            if (typeof value === 'object') {
                if (value.w !== undefined) {
                    this._concretePrecision = 4;
                }
                else if (value.z !== undefined) {
                    this._concretePrecision = 3;
                }
                else if (value.y !== undefined) {
                    this._concretePrecision = 2;
                }
            }
        }
        return this._concretePrecision;
    }
}
exports.ShaderSlot = ShaderSlot;
class ShaderEdgeSlot {
    constructor() {
        this.id = 0;
        this.nodeUuid = '';
    }
    set(data) {
        this.id = data.m_SlotId;
        this.nodeUuid = data.m_NodeGUIDSerialized;
    }
}
exports.ShaderEdgeSlot = ShaderEdgeSlot;
class ShaderEdge {
    constructor(data) {
        this.type = {};
        this.data = {};
        this.input = new ShaderEdgeSlot;
        this.output = new ShaderEdgeSlot;
        this.type = data.typeInfo;
        this.data = utils_1.getJsonObject(data.JSONnodeData);
        this.input.set(this.data.m_InputSlot);
        this.output.set(this.data.m_OutputSlot);
    }
}
exports.ShaderEdge = ShaderEdge;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUF3RDtBQUl4RCxNQUFhLGFBQWE7SUFNdEIsWUFBYSxHQUFRO1FBTHJCLFNBQUksR0FBRyxFQUFFLENBQUM7UUFDVixTQUFJLEdBQVEsRUFBRSxDQUFBO1FBRWQsU0FBSSxHQUFHLEVBQUUsQ0FBQztRQUdOLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLHFCQUFhLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRTVDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDN0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELElBQUksWUFBWTtRQUNaLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDN0IsQ0FBQztJQUVELElBQUksaUJBQWlCO1FBQ2pCLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1FBRTFCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDOUIsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDM0IsSUFBSSxLQUFLLENBQUMsQ0FBQyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRTtnQkFDaEQsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO2FBQ3pCO2lCQUNJLElBQUksS0FBSyxDQUFDLENBQUMsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUU7Z0JBQ3JELGlCQUFpQixHQUFHLENBQUMsQ0FBQzthQUN6QjtpQkFDSSxJQUFJLEtBQUssQ0FB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S0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNKO0FBZEQsZ0NBY0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRKc29uT2JqZWN0LCBnZXRGbG9hdFN0cmluZyB9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB7IGVtaXQgfSBmcm9tIFwicHJvY2Vzc1wiO1xyXG5pbXBvcnQgU3ViR3JhcGhOb2RlIGZyb20gXCIuL25vZGVzL3N1YmdyYXBoL1N1YkdyYXBoTm9kZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNoYWRlclByb3Blcnkge1xyXG4gICAgdHlwZSA9IHt9O1xyXG4gICAgZGF0YTogYW55ID0ge31cclxuXHJcbiAgICBuYW1lID0gJyc7XHJcblxyXG4gICAgY29uc3RydWN0b3IgKG9iajogYW55KSB7XHJcbiAgICAgICAgdGhpcy50eXBlID0gb2JqLnR5cGU7XHJcbiAgICAgICAgdGhpcy5kYXRhID0gZ2V0SnNvbk9iamVjdChvYmouSlNPTm5vZGVEYXRhKTtcclxuXHJcbiAgICAgICAgdGhpcy5uYW1lID0gdGhpcy5kYXRhLm1fTmFtZTtcclxuICAgICAgICB0aGlzLm5hbWUgPSB0aGlzLm5hbWUucmVwbGFjZSgvIC9nLCAnXycpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBkZWZhdWx0VmFsdWUgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGEubV9WYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgY29uY3JldGVQcmVjaXNpb24gKCkge1xyXG4gICAgICAgIGxldCBjb25jcmV0ZVByZWNpc2lvbiA9IDE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZGVmYXVsdFZhbHVlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS53ICE9PSB1bmRlZmluZWQgfHwgdmFsdWUuciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25jcmV0ZVByZWNpc2lvbiA9IDQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUueiAhPT0gdW5kZWZpbmVkIHx8IHZhbHVlLmcgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uY3JldGVQcmVjaXNpb24gPSAzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlLnkgIT09IHVuZGVmaW5lZCB8fCB2YWx1ZS5iICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbmNyZXRlUHJlY2lzaW9uID0gMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNvbmNyZXRlUHJlY2lzaW9uO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2hhZGVyTm9kZSB7XHJcbiAgICB0eXBlID0ge307XHJcbiAgICBkYXRhOiBhbnkgPSB7fVxyXG5cclxuICAgIHByaW9yaXR5ID0gMDtcclxuICAgIHV1aWQgPSAnJztcclxuICAgIHNsb3RzOiBTaGFkZXJTbG90W10gPSBbXTtcclxuICAgIHNsb3RzTWFwOiBNYXA8bnVtYmVyLCBTaGFkZXJTbG90PiA9IG5ldyBNYXA7XHJcblxyXG4gICAgZGVwczogU2hhZGVyTm9kZVtdID0gW11cclxuXHJcbiAgICBpc01hc3Rlck5vZGUgPSBmYWxzZTtcclxuICAgIGZpeGVkQ29uY3JldGVQcmVjaXNpb24gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBzdWJncmFwaE5vZGU6IFN1YkdyYXBoTm9kZSB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yIChkYXRhOiBhbnkpIHtcclxuICAgICAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGVJbmZvO1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IGdldEpzb25PYmplY3QoZGF0YS5KU09Obm9kZURhdGEpO1xyXG5cclxuICAgICAgICB0aGlzLnV1aWQgPSB0aGlzLmRhdGEubV9HdWlkU2VyaWFsaXplZDtcclxuICAgICAgICB0aGlzLnNsb3RzID0gdGhpcy5kYXRhLm1fU2VyaWFsaXphYmxlU2xvdHMubWFwKGQgPT4ge1xyXG4gICAgICAgICAgICBsZXQgc2xvdCA9IG5ldyBTaGFkZXJTbG90KGQsIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLnNsb3RzTWFwLnNldChzbG90LmlkLCBzbG90KTtcclxuICAgICAgICAgICAgcmV0dXJuIHNsb3Q7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRGVwZW5kZW5jeSAoZGVwKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRlcHMuaW5jbHVkZXMoZGVwKSkge1xyXG4gICAgICAgICAgICB0aGlzLmRlcHMucHVzaChkZXApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjYWxjQ29uY3JldGVQcmVjaXNpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5maXhlZENvbmNyZXRlUHJlY2lzaW9uKSB7XHJcbiAgICAgICAgICAgIGxldCBtaW5Db25jcmV0ZVByZWNpc2lvbiA9IDk5OTtcclxuICAgICAgICAgICAgdGhpcy5pbnB1dFNsb3RzLmZvckVhY2goc2xvdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29uY3JldGVQcmVjaXNpb24gPSBzbG90LmNvbmNyZXRlUHJlY2lzaW9uO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNsb3QuY29ubmVjdFNsb3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25jcmV0ZVByZWNpc2lvbiA9IHNsb3QuY29ubmVjdFNsb3QuY29uY3JldGVQcmVjaXNpb247XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBtaW5Db25jcmV0ZVByZWNpc2lvbiA9IE1hdGgubWluKG1pbkNvbmNyZXRlUHJlY2lzaW9uLCBjb25jcmV0ZVByZWNpc2lvbik7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICB0aGlzLnNsb3RzLmZvckVhY2goc2xvdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBzbG90Ll9jb25jcmV0ZVByZWNpc2lvbiA9IG1pbkNvbmNyZXRlUHJlY2lzaW9uO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRQcmlvcml0eSAocHJpb3JpdHkpIHtcclxuICAgICAgICB0aGlzLnByaW9yaXR5ID0gTWF0aC5tYXgocHJpb3JpdHksIHRoaXMucHJpb3JpdHkpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5kZXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVwc1tpXS5zZXRQcmlvcml0eSh0aGlzLnByaW9yaXR5ICsgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldCBvdXRwdXRTbG90cyAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2xvdHMuZmlsdGVyKHMgPT4gcy50eXBlID09PSBTaGFkZXJTbG90VHlwZS5PdXRwdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBpbnB1dFNsb3RzICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zbG90cy5maWx0ZXIocyA9PiBzLnR5cGUgPT09IFNoYWRlclNsb3RUeXBlLklucHV0KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRTbG90V2l0aFNsb3ROYW1lIChuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2xvdHMuZmluZChzID0+IHMuZGlzcGxheU5hbWUgPT09IG5hbWUpO1xyXG4gICAgfVxyXG4gICAgZ2V0T3V0cHV0U2xvdFdpdGhTbG90TmFtZSAobmFtZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dFNsb3RzLmZpbmQocyA9PiBzLmRpc3BsYXlOYW1lID09PSBuYW1lKTtcclxuICAgIH1cclxuICAgIGdldE91dHB1dFZhck5hbWUgKGlkeCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm91dHB1dFNsb3RzW2lkeF0udmFyTmFtZTtcclxuICAgIH1cclxuICAgIGdldE91dHB1dFZhckRlZmluZSAoaWR4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3V0cHV0U2xvdHNbaWR4XS52YXJEZWZpbmU7XHJcbiAgICB9XHJcbiAgICBnZXRJbnB1dFZhbHVlIChpZHgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dFNsb3RzW2lkeF0uc2xvdFZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlQ29kZSAoKSB7XHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG59XHJcblxyXG5sZXQgX0dsb2JhbFNoYWRlclNsb3RJRF8gPSAwO1xyXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRHbG9iYWxTaGFkZXJTbG90SUQgKCkge1xyXG4gICAgX0dsb2JhbFNoYWRlclNsb3RJRF8gPSAwO1xyXG59XHJcblxyXG5leHBvcnQgZW51bSBTaGFkZXJTbG90VHlwZSB7XHJcbiAgICBJbnB1dCxcclxuICAgIE91dHB1dFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2hhZGVyU2xvdCB7XHJcbiAgICB0eXBlSW5mbyA9IHt9O1xyXG4gICAgZGF0YTogYW55ID0ge31cclxuXHJcbiAgICBpZCA9IDA7XHJcblxyXG4gICAgZ2xvYmFsSUQgPSAwO1xyXG4gICAgZGlzcGxheU5hbWUgPSAnJztcclxuXHJcbiAgICBjb25uZWN0U2xvdDogU2hhZGVyU2xvdCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuICAgIG5vZGU6IFNoYWRlck5vZGUgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgdHlwZSA9IFNoYWRlclNsb3RUeXBlLklucHV0O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yIChvYmo6IGFueSwgbm9kZTogU2hhZGVyTm9kZSkge1xyXG4gICAgICAgIHRoaXMudHlwZUluZm8gPSBvYmoudHlwZUluZm87XHJcbiAgICAgICAgdGhpcy5kYXRhID0gZ2V0SnNvbk9iamVjdChvYmouSlNPTm5vZGVEYXRhKTtcclxuXHJcbiAgICAgICAgdGhpcy50eXBlID0gdGhpcy5kYXRhLm1fU2xvdFR5cGUgYXMgU2hhZGVyU2xvdFR5cGU7XHJcblxyXG4gICAgICAgIHRoaXMubm9kZSA9IG5vZGU7XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSB0aGlzLmRhdGEubV9JZDtcclxuICAgICAgICB0aGlzLmdsb2JhbElEID0gX0dsb2JhbFNoYWRlclNsb3RJRF8rKztcclxuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gdGhpcy5kYXRhLm1fRGlzcGxheU5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHZhck5hbWUgKCkge1xyXG4gICAgICAgIHJldHVybiAndmFyXycgKyB0aGlzLmdsb2JhbElEO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB2YXJEZWZpbmUgKCkge1xyXG4gICAgICAgIGxldCBwcmVjaXNpb24gPSAnJztcclxuICAgICAgICBpZiAodGhpcy5jb25jcmV0ZVByZWNpc2lvbiA9PT0gMSkge1xyXG4gICAgICAgICAgICBwcmVjaXNpb24gPSAnZmxvYXQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLmNvbmNyZXRlUHJlY2lzaW9uID09PSAyKSB7XHJcbiAgICAgICAgICAgIHByZWNpc2lvbiA9ICd2ZWMyJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5jb25jcmV0ZVByZWNpc2lvbiA9PT0gMykge1xyXG4gICAgICAgICAgICBwcmVjaXNpb24gPSAndmVjMyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuY29uY3JldGVQcmVjaXNpb24gPT09IDQpIHtcclxuICAgICAgICAgICAgcHJlY2lzaW9uID0gJ3ZlYzQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocHJlY2lzaW9uKSB7XHJcbiAgICAgICAgICAgIHByZWNpc2lvbiArPSAnICc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwcmVjaXNpb24gKyB0aGlzLnZhck5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGRlZmF1bHRWYWx1ZSAoKSB7XHJcbiAgICAgICAgbGV0IGRlZmF1bHRWYWx1ZSA9IHRoaXMuZGF0YS5tX1ZhbHVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCB4ID0gZ2V0RmxvYXRTdHJpbmcoZGVmYXVsdFZhbHVlLngpO1xyXG4gICAgICAgIGxldCB5ID0gZ2V0RmxvYXRTdHJpbmcoZGVmYXVsdFZhbHVlLnkpO1xyXG4gICAgICAgIGxldCB6ID0gZ2V0RmxvYXRTdHJpbmcoZGVmYXVsdFZhbHVlLnopO1xyXG4gICAgICAgIGxldCB3ID0gZ2V0RmxvYXRTdHJpbmcoZGVmYXVsdFZhbHVlLncpO1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0ID0gZGVmYXVsdFZhbHVlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICBpZiAoZGVmYXVsdFZhbHVlLncgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYHZlYzQoJHt4fSwgJHt5fSwgJHt6fSwgJHt3fSlgO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlZmF1bHRWYWx1ZS56ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGB2ZWMzKCR7eH0sICR7eX0sICR7en0pYDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChkZWZhdWx0VmFsdWUueSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBgdmVjMigke3h9LCAke3l9KWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNsb3RWYWx1ZSAoKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdDtcclxuICAgICAgICBsZXQgdmFsdWVDb25yZXRlUHJlc2l0aW9uID0gdGhpcy5kZWZhdWx0Q29uY3JldGVQcmVjaXNpb247XHJcbiAgICAgICAgbGV0IGRlZmF1bHRWYWx1ZSA9IHRoaXMuZGF0YS5tX1ZhbHVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCB4ID0gZ2V0RmxvYXRTdHJpbmcoZGVmYXVsdFZhbHVlLngpO1xyXG4gICAgICAgIGxldCB5ID0gZ2V0RmxvYXRTdHJpbmcoZGVmYXVsdFZhbHVlLnkpO1xyXG4gICAgICAgIGxldCB6ID0gZ2V0RmxvYXRTdHJpbmcoZGVmYXVsdFZhbHVlLnopO1xyXG4gICAgICAgIGxldCB3ID0gZ2V0RmxvYXRTdHJpbmcoZGVmYXVsdFZhbHVlLncpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdFNsb3QpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubm9kZT8uaXNNYXN0ZXJOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQgPSBkZWZhdWx0VmFsdWU7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRlZmF1bHRWYWx1ZS53ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBgdmVjNCgke3h9LCAke3l9LCAke3p9LCAke3d9KWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkZWZhdWx0VmFsdWUueiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYHZlYzMoJHt4fSwgJHt5fSwgJHt6fSlgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZGVmYXVsdFZhbHVlLnkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGB2ZWMyKCR7eH0sICR7eX0pYDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5jb25uZWN0U2xvdC52YXJOYW1lO1xyXG4gICAgICAgICAgICB2YWx1ZUNvbnJldGVQcmVzaXRpb24gPSB0aGlzLmNvbm5lY3RTbG90LmNvbmNyZXRlUHJlY2lzaW9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY29uY3JldGVQcmVjaXNpb24gIT09IHZhbHVlQ29ucmV0ZVByZXNpdGlvbikge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb25jcmV0ZVByZWNpc2lvbiA8IHZhbHVlQ29ucmV0ZVByZXNpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29uY3JldGVQcmVjaXNpb24gPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJy54JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuY29uY3JldGVQcmVjaXNpb24gPT09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJy54eSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmNvbmNyZXRlUHJlY2lzaW9uID09PSAzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcueHl6JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCBkaWYgPSB0aGlzLmNvbmNyZXRlUHJlY2lzaW9uIC0gdmFsdWVDb25yZXRlUHJlc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0ciA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpZiA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ciArPSBgJHt4fWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkaWYgPT09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHIgKz0gYCR7eH0sICR7eX1gO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZGlmID09PSAzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IGAke3h9LCAke3l9LCAke3p9YDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jb25jcmV0ZVByZWNpc2lvbiA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGB2ZWMyKCR7cmVzdWx0fSwgJHtzdHJ9KTtgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5jb25jcmV0ZVByZWNpc2lvbiA9PT0gMykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGB2ZWMzKCR7cmVzdWx0fSwgJHtzdHJ9KWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmNvbmNyZXRlUHJlY2lzaW9uID09PSA0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYHZlYzQoJHtyZXN1bHR9LCAke3N0cn0pYDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBkZWZhdWx0Q29uY3JldGVQcmVjaXNpb24gKCkge1xyXG4gICAgICAgIGxldCBjb25jcmV0ZVByZWNpc2lvbiA9IDE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZGF0YS5tX1ZhbHVlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS53ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbmNyZXRlUHJlY2lzaW9uID0gNDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZS56ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbmNyZXRlUHJlY2lzaW9uID0gMztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZS55ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbmNyZXRlUHJlY2lzaW9uID0gMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNvbmNyZXRlUHJlY2lzaW9uO1xyXG4gICAgfVxyXG5cclxuICAgIF9jb25jcmV0ZVByZWNpc2lvbiA9IC0xO1xyXG4gICAgZ2V0IGNvbmNyZXRlUHJlY2lzaW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5fY29uY3JldGVQcmVjaXNpb24gPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbmNyZXRlUHJlY2lzaW9uID0gMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZGF0YS5tX1ZhbHVlO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLncgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbmNyZXRlUHJlY2lzaW9uID0gNDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlLnogIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbmNyZXRlUHJlY2lzaW9uID0gMztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlLnkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbmNyZXRlUHJlY2lzaW9uID0gMjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fY29uY3JldGVQcmVjaXNpb247XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTaGFkZXJFZGdlU2xvdCB7XHJcbiAgICBpZCA9IDA7XHJcbiAgICBub2RlVXVpZCA9ICcnO1xyXG5cclxuICAgIHNldCAoZGF0YTogYW55KSB7XHJcbiAgICAgICAgdGhpcy5pZCA9IGRhdGEubV9TbG90SWQ7XHJcbiAgICAgICAgdGhpcy5ub2RlVXVpZCA9IGRhdGEubV9Ob2RlR1VJRFNlcmlhbGl6ZWQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTaGFkZXJFZGdlIHtcclxuICAgIHR5cGUgPSB7fTtcclxuICAgIGRhdGE6IGFueSA9IHt9XHJcblxyXG4gICAgaW5wdXQ6IFNoYWRlckVkZ2VTbG90ID0gbmV3IFNoYWRlckVkZ2VTbG90O1xyXG4gICAgb3V0cHV0OiBTaGFkZXJFZGdlU2xvdCA9IG5ldyBTaGFkZXJFZGdlU2xvdDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvciAoZGF0YTogYW55KSB7XHJcbiAgICAgICAgdGhpcy50eXBlID0gZGF0YS50eXBlSW5mbztcclxuICAgICAgICB0aGlzLmRhdGEgPSBnZXRKc29uT2JqZWN0KGRhdGEuSlNPTm5vZGVEYXRhKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnB1dC5zZXQodGhpcy5kYXRhLm1fSW5wdXRTbG90KTtcclxuICAgICAgICB0aGlzLm91dHB1dC5zZXQodGhpcy5kYXRhLm1fT3V0cHV0U2xvdCk7XHJcbiAgICB9XHJcbn0iXX0=