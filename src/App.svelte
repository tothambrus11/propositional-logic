<script lang="ts">
    import {lex, parse, TokenType} from "./parser";

    let text = "";
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

    $:{
        console.clear();
        console.log(parse(lex(text)));
    }

    let inputEl: HTMLInputElement;

</script>
<input bind:value={text} bind:this={inputEl}/>
{text}

<style>
    input {
        padding: 5px 10px;
        font-size: 1.2em;
        font-family: inherit;

    }
</style>