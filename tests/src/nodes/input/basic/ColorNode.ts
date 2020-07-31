import { ShaderNode, ShaderSlotType, ShaderSlot } from "../../../base";

export default class ColorNode extends ShaderNode {
    fixedConcretePrecision = true;

    generateCode () {
        let x = this.getInputValue(0);
        let y = this.getInputValue(1);
        let z = this.getInputValue(2);
        let w = this.getInputValue(3);
        return `vec4 ${this.getOutputVarName(0)} = vec4(${x}, ${y}, ${z}, ${w});`;
    }
}
