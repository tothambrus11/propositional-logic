    <script lang="ts">
        import {ASTNode, BinaryConnectiveNode, lex, parse, TokenType, UnaryConnectiveNode, VariableNode} from "./parser";

        let text = "a∧b∧b∧b∧b";
        $: {
            let selectionPos = inputEl ? inputEl.selectionStart : text.length;
            let st = text.slice(0, selectionPos);
            let et = text.slice(selectionPos || text.length);

            if (st.endsWith("xor")) {
                text = st.slice(0, -3) + "⊕" + et;
                selectionPos
            } else if (st.endsWith("or")) {
                text = st.slice(0, -2) + "∨" + et;
                selectionPos--;
            } else if (st.endsWith("and")) {
                text = st.slice(0, -3) + "∧" + et;
                selectionPos -= 2;
            } else if (st.endsWith("not")) {
                text = st.slice(0, -3) + "¬" + et;
                selectionPos -= 2;
            } else if (st.endsWith("<->")) {
                text = st.slice(0, -3) + "↔" + et;
                selectionPos -= 2;
            } else if (st.endsWith("->")) {
                text = st.slice(0, -2) + "→" + et;
                selectionPos--;
            } else if (st.charAt(st.length - 3) === '<' && st.charAt(st.length - 2) === "-") {
                text = st.slice(0, -3) + "←" + st.charAt(st.length - 1) + et;
                selectionPos--;
            }
            setTimeout(() => {
                inputEl?.setSelectionRange(selectionPos, selectionPos);
            }, 0);
        }

        let variableList = [];
        $:{
            console.clear();
            let ast = parse(lex(text));
            let variables = new Map();

            console.log(ast)

            function traverse(node: ASTNode) {
                if (node instanceof BinaryConnectiveNode) {
                    traverse(node.childLeft);
                    traverse(node.childRight);
                } else if (node instanceof UnaryConnectiveNode) {
                    traverse(node.child);
                } else if (node instanceof VariableNode) {
                    variables.set(node.name, true);
                }
            }

            traverse(ast);
            variableList = [...variables.keys()].sort();

            console.log(variableList)
            let r = document.createRange();


            for (let i = 0; i < 4 && inputEl; i++) {
                try {
                    r.setStartBefore(inputEl);
                    r.setEndAfter(inputEl);

                    console.log(r.getBoundingClientRect())
                } catch (e) {
                    console.log(e)
                }
            }


            rows = Array(2 ** variableList.length).fill(0).map((_, i) => {
                let varMap = {};
                for (let j = 0; j < variableList.length; j++) {
                    let v = variableList[j];
                    varMap[v] = (i >> (variableList.length - j - 1)) & 1;
                }

                try {
                    return {
                        rowNumber: i,
                        variableValues: Object.values(varMap),
                        result: +ast?.result(varMap)
                    }
                }catch (e){
                    console.log(e);
                    return {
                        rowNumber: i,
                        variableValues: Object.values(varMap),
                        result: NaN
                    }
                }
            });

        }
        let rows: { rowNumber: number, variableValues: number[], result: number}[] = [];

        let inputEl: HTMLInputElement;

        $: chars = text.split("");
        $: columns = Math.max(1, text.length) + variableList.length;

    </script>
    <div id="header">
        <input bind:value={text} bind:this={inputEl}/>
    </div>
    <div id="grid" style="grid-template-columns: repeat({variableList.length}, 32px) repeat({chars.length}, auto)">

        {#each variableList as element}
            <div class="exp-var">
                <div>
                {element}
                </div>
            </div>
        {/each}

        {#each chars as c}
            <div class="exp-letter">
                <span>{c}</span>
            </div>
        {/each}

        {#each rows as row}
            {#each row.variableValues as varValue}
                <div class="var-value">
                    <div>{varValue}</div>
                </div>
            {/each}
            <div style="border-left: 1px solid black; display: flex; align-items: center"><span style="transform: translateX(10px); display: block; font-weight: bold">{row.result}</span></div>
            {#each Array(Math.max(0, chars.length - 1)).fill(0) as k}
                <div></div>
            {/each}
        {/each}

    </div>


    <div>
    </div>
    <style>
        input {
            padding: 5px 10px;
            font-size: 1.2em;
            font-family: inherit;
            border: none;
            border-bottom: 2px solid var(--border-color);
            outline: none;
        }



        #grid > * {
            font-size: 1.2em;
        }

        #grid {
            display: grid;
            justify-content: flex-start;
            gap: 0  ;
            grid-auto-rows: 40px;
        }

        .exp-letter {
            padding: 4px;
            box-sizing: border-box;
            background-color: #9ce695;

            display: flex;
            justify-content: center;
            align-items: center;

        }

        .exp-var{
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #eee;
        }

        .var-value{
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #header {
            display: flex;
        }

    </style>