"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShaderGraph = void 0;
const base_1 = require("./base");
const utils_1 = require("./utils");
const nodes_1 = require("./nodes");
const MasterNode_1 = __importDefault(require("./nodes/master/MasterNode"));
const SubGraphNode_1 = __importDefault(require("./nodes/subgraph/SubGraphNode"));
const fs_1 = __importDefault(require("fs"));
const PropertyNode_1 = __importDefault(require("./nodes/input/PropertyNode"));
class ShaderGraph {
    static searchNodes(graphPath) {
        let contentStr = fs_1.default.readFileSync(graphPath, 'utf-8');
        let content = utils_1.getJsonObject(contentStr);
        if (!content)
            return;
        let properties = content.m_SerializedProperties.map(d => new base_1.ShaderPropery(d));
        let nodeMap = new Map;
        let nodes = content.m_SerializableNodes.map(d => {
            let node = nodes_1.createNode(d);
            if (node instanceof PropertyNode_1.default) {
                node.searchProperties(properties);
            }
            nodeMap.set(node.uuid, node);
            return node;
        });
        let edges = content.m_SerializableEdges.map(d => {
            return new base_1.ShaderEdge(d);
        });
        for (let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            let inputSlot = edge.input;
            let outputSlot = edge.output;
            let inputNode = nodeMap.get(inputSlot.nodeUuid);
            let outputNode = nodeMap.get(outputSlot.nodeUuid);
            if (outputNode instanceof SubGraphNode_1.default) {
                outputNode = outputNode.excahngeSubGraphOutNode(outputSlot);
            }
            if (!inputNode) {
                console.warn(`Can not find input [${inputSlot.nodeUuid}] for edge.`);
                continue;
            }
            if (!outputNode) {
                console.warn(`Can not find input [${outputSlot.nodeUuid}] for edge.`);
                continue;
            }
            inputNode.addDependency(outputNode);
            outputNode.setPriority(inputNode.priority + 1);
            let inputNodeSlot = inputNode.slotsMap.get(inputSlot.id);
            let outputNodeSlot = outputNode.slotsMap.get(outputSlot.id);
            if (inputNodeSlot) {
                inputNodeSlot.connectSlot = outputNodeSlot;
                // inputNodeSlot.type = ShaderSlotType.Input;
            }
            if (outputNodeSlot) {
                outputNodeSlot.connectSlot = inputNodeSlot;
                // outputNodeSlot.type = ShaderSlotType.Output;
            }
        }
        return {
            properties,
            nodeMap,
            nodes,
            edges
        };
    }
    static decode(path) {
        base_1.resetGlobalShaderSlotID();
        let res = this.searchNodes(path);
        if (!res) {
            return;
        }
        let { properties, nodeMap, nodes, edges } = res;
        nodes.sort((a, b) => b.priority - a.priority);
        nodes.forEach(node => {
            node.calcConcretePrecision();
        });
        let masterNode = nodes.find(n => n instanceof MasterNode_1.default);
        if (!masterNode) {
            console.error('Can not find master node.');
            return;
        }
        masterNode.properties = properties;
        // for (let i = 0; i < nodes.length; i++) {
        //     let node = nodes[i];
        //     let code = node.generateCode();
        // }
        let code = masterNode.generateCode();
        return code;
    }
}
exports.ShaderGraph = ShaderGraph;
ShaderGraph.subgraphPath = '';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZGVyZ3JhcGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2hhZGVyZ3JhcGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsaUNBQXdHO0FBQ3hHLG1DQUF3QztBQUN4QyxtQ0FBcUM7QUFDckMsMkVBQW1EO0FBQ25ELGlGQUF5RDtBQUd6RCw0Q0FBbUI7QUFFbkIsOEVBQXNEO0FBR3RELE1BQWEsV0FBVztJQUdwQixNQUFNLENBQUMsV0FBVyxDQUFFLFNBQWlCO1FBQ2pDLElBQUksVUFBVSxHQUFHLFlBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELElBQUksT0FBTyxHQUFHLHFCQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLE9BQU87WUFBRSxPQUFPO1FBRXJCLElBQUksVUFBVSxHQUFvQixPQUFPLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxvQkFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEcsSUFBSSxPQUFPLEdBQTRCLElBQUksR0FBRyxDQUFDO1FBRS9DLElBQUksS0FBSyxHQUFpQixPQUFPLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzFELElBQUksSUFBSSxHQUFHLGtCQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekIsSUFBSSxJQUFJLFlBQVksc0JBQVksRUFBRTtnQkFDOUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3JDO1lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdCLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxLQUFLLEdBQWlCLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMs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QXlCLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUVuRCwyQ0FBMkM7UUFDM0MsMkJBQTJCO1FBQzNCLHNDQUFzQztRQUN0QyxJQUFJO1FBRUosSUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3JDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7O0FBdkdMLGtDQXdHQztBQXZHVSx3QkFBWSxHQUFHLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNoYWRlclByb3BlcnksIFNoYWRlck5vZGUsIFNoYWRlckVkZ2UsIHJlc2V0R2xvYmFsU2hhZGVyU2xvdElELCBTaGFkZXJTbG90VHlwZSB9IGZyb20gXCIuL2Jhc2VcIjtcclxuaW1wb3J0IHsgZ2V0SnNvbk9iamVjdCB9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB7IGNyZWF0ZU5vZGUgfSBmcm9tIFwiLi9ub2Rlc1wiO1xyXG5pbXBvcnQgTWFzdGVyTm9kZSBmcm9tIFwiLi9ub2Rlcy9tYXN0ZXIvTWFzdGVyTm9kZVwiO1xyXG5pbXBvcnQgU3ViR3JhcGhOb2RlIGZyb20gXCIuL25vZGVzL3N1YmdyYXBoL1N1YkdyYXBoTm9kZVwiO1xyXG5cclxuaW1wb3J0IGdsb2JieSBmcm9tICdnbG9iYnknXHJcbmltcG9ydCBmcyBmcm9tICdmcydcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuaW1wb3J0IFByb3BlcnR5Tm9kZSBmcm9tIFwiLi9ub2Rlcy9pbnB1dC9Qcm9wZXJ0eU5vZGVcIjtcclxuaW1wb3J0IFN1YkdyYXBoT3V0cHV0Tm9kZSBmcm9tIFwiLi9ub2Rlcy9zdWJncmFwaC9TdWJHcmFwaE91dHB1dE5vZGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTaGFkZXJHcmFwaCB7XHJcbiAgICBzdGF0aWMgc3ViZ3JhcGhQYXRoID0gJydcclxuXHJcbiAgICBzdGF0aWMgc2VhcmNoTm9kZXMgKGdyYXBoUGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGNvbnRlbnRTdHIgPSBmcy5yZWFkRmlsZVN5bmMoZ3JhcGhQYXRoLCAndXRmLTgnKTtcclxuICAgICAgICBsZXQgY29udGVudCA9IGdldEpzb25PYmplY3QoY29udGVudFN0cik7XHJcbiAgICAgICAgaWYgKCFjb250ZW50KSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBwcm9wZXJ0aWVzOiBTaGFkZXJQcm9wZXJ5W10gPSBjb250ZW50Lm1fU2VyaWFsaXplZFByb3BlcnRpZXMubWFwKGQgPT4gbmV3IFNoYWRlclByb3BlcnkoZCkpO1xyXG4gICAgICAgIGxldCBub2RlTWFwOiBNYXA8c3RyaW5nLCBTaGFkZXJOb2RlPiA9IG5ldyBNYXA7XHJcblxyXG4gICAgICAgIGxldCBub2RlczogU2hhZGVyTm9kZVtdID0gY29udGVudC5tX1NlcmlhbGl6YWJsZU5vZGVzLm1hcChkID0+IHtcclxuICAgICAgICAgICAgbGV0IG5vZGUgPSBjcmVhdGVOb2RlKGQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBQcm9wZXJ0eU5vZGUpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUuc2VhcmNoUHJvcGVydGllcyhwcm9wZXJ0aWVzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbm9kZU1hcC5zZXQobm9kZS51dWlkLCBub2RlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBlZGdlczogU2hhZGVyRWRnZVtdID0gY29udGVudC5tX1NlcmlhbGl6YWJsZUVkZ2VzLm1hcChkID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTaGFkZXJFZGdlKGQpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlZGdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgZWRnZSA9IGVkZ2VzW2ldO1xyXG4gICAgICAgICAgICBsZXQgaW5wdXRTbG90ID0gZWRnZS5pbnB1dDtcclxuICAgICAgICAgICAgbGV0IG91dHB1dFNsb3QgPSBlZGdlLm91dHB1dDtcclxuXHJcbiAgICAgICAgICAgIGxldCBpbnB1dE5vZGUgPSBub2RlTWFwLmdldChpbnB1dFNsb3Qubm9kZVV1aWQpO1xyXG4gICAgICAgICAgICBsZXQgb3V0cHV0Tm9kZSA9IG5vZGVNYXAuZ2V0KG91dHB1dFNsb3Qubm9kZVV1aWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG91dHB1dE5vZGUgaW5zdGFuY2VvZiBTdWJHcmFwaE5vZGUpIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dE5vZGUgPSBvdXRwdXROb2RlLmV4Y2FobmdlU3ViR3JhcGhPdXROb2RlKG91dHB1dFNsb3QpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlucHV0Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDYW4gbm90IGZpbmQgaW5wdXQgWyR7aW5wdXRTbG90Lm5vZGVVdWlkfV0gZm9yIGVkZ2UuYClcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghb3V0cHV0Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDYW4gbm90IGZpbmQgaW5wdXQgWyR7b3V0cHV0U2xvdC5ub2RlVXVpZH1dIGZvciBlZGdlLmApXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaW5wdXROb2RlLmFkZERlcGVuZGVuY3kob3V0cHV0Tm9kZSk7XHJcbiAgICAgICAgICAgIG91dHB1dE5vZGUuc2V0UHJpb3JpdHkoaW5wdXROb2RlLnByaW9yaXR5ICsgMSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgaW5wdXROb2RlU2xvdCA9IGlucHV0Tm9kZS5zbG90c01hcC5nZXQoaW5wdXRTbG90LmlkKTtcclxuICAgICAgICAgICAgbGV0IG91dHB1dE5vZGVTbG90ID0gb3V0cHV0Tm9kZS5zbG90c01hcC5nZXQob3V0cHV0U2xvdC5pZCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoaW5wdXROb2RlU2xvdCkge1xyXG4gICAgICAgICAgICAgICAgaW5wdXROb2RlU2xvdC5jb25uZWN0U2xvdCA9IG91dHB1dE5vZGVTbG90O1xyXG4gICAgICAgICAgICAgICAgLy8gaW5wdXROb2RlU2xvdC50eXBlID0gU2hhZGVyU2xvdFR5cGUuSW5wdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG91dHB1dE5vZGVTbG90KSB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXROb2RlU2xvdC5jb25uZWN0U2xvdCA9IGlucHV0Tm9kZVNsb3Q7XHJcbiAgICAgICAgICAgICAgICAvLyBvdXRwdXROb2RlU2xvdC50eXBlID0gU2hhZGVyU2xvdFR5cGUuT3V0cHV0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzLFxyXG4gICAgICAgICAgICBub2RlTWFwLFxyXG4gICAgICAgICAgICBub2RlcyxcclxuICAgICAgICAgICAgZWRnZXNcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGRlY29kZSAocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVzZXRHbG9iYWxTaGFkZXJTbG90SUQoKTtcclxuXHJcbiAgICAgICAgbGV0IHJlcyA9IHRoaXMuc2VhcmNoTm9kZXMocGF0aCk7XHJcbiAgICAgICAgaWYgKCFyZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHsgcHJvcGVydGllcywgbm9kZU1hcCwgbm9kZXMsIGVkZ2VzIH0gPSByZXM7XHJcblxyXG4gICAgICAgIG5vZGVzLnNvcnQoKGEsIGIpID0+IGIucHJpb3JpdHkgLSBhLnByaW9yaXR5KTtcclxuXHJcbiAgICAgICAgbm9kZXMuZm9yRWFjaChub2RlID0+IHtcclxuICAgICAgICAgICAgbm9kZS5jYWxjQ29uY3JldGVQcmVjaXNpb24oKTtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBsZXQgbWFzdGVyTm9kZSA9IG5vZGVzLmZpbmQobiA9PiBuIGluc3RhbmNlb2YgTWFzdGVyTm9kZSk7XHJcbiAgICAgICAgaWYgKCFtYXN0ZXJOb2RlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NhbiBub3QgZmluZCBtYXN0ZXIgbm9kZS4nKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgKG1hc3Rlck5vZGUgYXMgTWFzdGVyTm9kZSkucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XHJcblxyXG4gICAgICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAvLyAgICAgbGV0IG5vZGUgPSBub2Rlc1tpXTtcclxuICAgICAgICAvLyAgICAgbGV0IGNvZGUgPSBub2RlLmdlbmVyYXRlQ29kZSgpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgbGV0IGNvZGUgPSBtYXN0ZXJOb2RlLmdlbmVyYXRlQ29kZSgpO1xyXG4gICAgICAgIHJldHVybiBjb2RlO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==