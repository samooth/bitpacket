# bitpacket

> Bitcoin transaction output builder

![bitpacket](bitpacket.webp)

bitpacket is a minimal JavaScript library for declaratively creating:

1. Unsigned bitcoin transactions
2. bitcoin output scripts

![code](code.png)

Because it only deals with output scripts, bitpacket has zero dependency on any API services.


You can use bitpacket to build bitcoin output scripts or unsigned transactions, and then feed into a wallet to build fully signed transactions.

---

# Design Principles

![comparison](comparison.png)

Bitpacket only deals with output scripts, which means you can use it to build outputs or unsigned transactions, and then incorporate them into existing wallet workflow.

You can think of Bitpacket as a library laser-focused on the "output" side of what [Paydata](https://github.com/samooth/paydata) does.

1. **Minimal:** Because it focuses only on outputs, it has gotten rid of the input-side API dependencies.
2. **Pluggable:** Because it's powered by the new [bsv2](https://github.com/samooth/bsv) and generates the bsv transaction and script objects, you can use it to construct an object, and pass it to another function which uses the `bsv` library directly. bitpacket even exposes the `bitpacket.bsv` object as one of its attributes so you can just use `bitpacket` instead of including both `bitpacket` and `bsv.Ecies` [docs](https://bsv.direct/docs/bsv.js/ecies.html) as well as provide much more powerful focused features just for building outputs.
3. **Wallet Compatible:** bitpacket fits into existing workflow easily. Most bitcoin app use cases delegate the **transaction input building** to 3rd party Bitcoin wallets anyway. You can simply use Bitpacket to build an unsigned transaction or bitcoin output scripts, and pass to wallet libraries to build fully signed transactions.

---

# Features

## 1. bsv2

Uses the new and lean [bsv2](https://github.com/samooth/bsv) instead of the old deprecated version.

## 2. only output

You can build either **output scripts** or **unsigned transactions**. Once you have either of the two, you can feed them into your existing wallet workflow.

---

# Install

## 1. Node.js

```
npm install --save @samooth/bitpacket
```

## 2. Browser

```
<script src="https://unpkg.com/@samooth/bitpacket"></script>
```

---

# Syntax

```
const bitpacket = require('@samooth/bitpacket')

// 1. build a single output script
let script = await bitpacket.script(<SCRIPT_DSL>)

// 2. build multiple output scripts
let scripts = await bitpacket.script([<SCRIPT_DSL>, <SCRIPT_DSL>, ...])

// 3. build an unsigned, output-only transaction
let tx = await bitpacket.tx([<SCRIPT_DSL>, <SCRIPT_DSL>, ...])
```

Where `<SCRIPT_DSL>` is a JavaScript object where each key follows a convention:

- `s[0-9]+`: **UTF8 chunk** (example: s0, s1, s2, ...) where the suffix integer represents the chunk position within a script
- `h[0-9]+`: **HEX chunk** (example: h0, h1, h2, ...) where the suffix integer represents the chunk position within a script
- `b[0-9]+`: **Buffer (node.js) or ArrayBuffer (browser) type chunk or BASE64 string** (example: b0, b1, b2, ...) where the suffix integer represents the chunk position within a script
  - if the value is `Buffer` type, then it will be treated as Buffer
  - if the value is `ArrayBuffer` type, then it will be treated as ArrayBuffer
  - if the value is `string` type, then it will be treated as a BASE64 string
- `o[0-9]+`: **Opcode string** (example: o0, o1, o2, ...) where the suffix integer represents the chunk position within a script

```
// SCRIPT_DSL example

{
  o0: "OP_0",
  o1: "OP_RETURN",
  s2: "Hello world",
  h3: "bdf63990d6dc33d705b756e13dd135466c06b3b5",
  b4: <Buffer|ArrayBuffer>
}
```



---

# Examples



## A. Script

### 1. Single output script

```
const bitpacket = require('@samooth/bitpacket')
let script = bitpacket.script({
  o0: "OP_0", o1: "OP_RETURN", s2: "A", s3: "is for", s4: "Alice"
})
```

### 2. Multiple output scripts

```
const bitpacket = require('@samooth/bitpacket')
let script = bitpacket.script([
  { o0: "OP_0", o1: "OP_RETURN", s2: "A", s3: "is for", s4: "Alice" },
  { o0: "OP_0", o1: "OP_RETURN", s2: "B", s3: "is for", s4: "Bob" },
  { o0: "OP_0", o1: "OP_RETURN", s2: "C", s3: "is for", s4: "Carol" }
])
```

### 3. Arbitrary output script

```
const bitpacket = require('@samooth/bitpacket')
let script = bitpacket.script({
  o0: "OP_DUP",
  o1: "OP_HASH160",
  h2: "bdf63990d6dc33d705b756e13dd135466c06b3b5",
  o3: "OP_EQUALVERIFY",
  o4: "OP_CHECKSIG",
  val: 1000
})
```

### 4. Buffer

```
const bitpacket = require('@samooth/bitpacket')
let script = bitpacket.script({
  o0: "OP_0",
  o1: "OP_RETURN",
  b2: Buffer.from("Hello world", "utf8")
})
```

### 5. ArrayBuffer (browser)

```
var reader = new FileReader();
var input = document.getElementById("files").files;
var data = new Blob([input[0]]);
reader.onload = function() {
  let script = await bitpacket.script({
    o0: "OP_0",
    o1: "OP_RETURN",
    b2: reader.result
  })
}
reader.readAsArrayBuffer(data);
```

### 6. Pay-to-pubkey-hash

Bitpacket includes a convenience method for pay-to-pubkey-hash. The examble right above can be re-written as following (`pkh` stands for "pubkey hash":

```
const bitpacket = require('@samooth/bitpacket')
let script = bitpacket.script({
  pkh: "bdf63990d6dc33d705b756e13dd135466c06b3b5",
  val: 1000
})
```

### 7. Address

Bitpacket also ships with another convenience method, where you can use `address` instead of `pkh` from the previous example:

```
const bitpacket = require('@samooth/bitpacket')
let script = bitpacket.script({
  address: "1JKRgG4F7k1b7PbAhQ7heEuV5aTJDpK9TS",
  val: 1000
})
```



---

## B. Transaction

Everything you can do with `script()` you can do with `tx()`.

### 1. Single transaction

```
let tx = bitpacket.tx([
  { o0: "OP_0", o1: "OP_RETURN", s2: "A", s3: "is for", s4: "Alice" },
  { o0: "OP_0", o1: "OP_RETURN", s2: "B", s3: "is for", s4: "Bob" },
  { o0: "OP_0", o1: "OP_RETURN", s2: "C", s3: "is for", s4: "Carol" }
])
```

### 2. Unsigned transaction with arbitrary outputs

```
 let tx = bitpacket.tx([
   { o0: "OP_0", o1: "OP_RETURN", s2: "hello" },
   {
     o0: "OP_DUP",
     o1: "OP_HASH160",
     h2: "bdf63990d6dc33d705b756e13dd135466c06b3b5",
     o3: "OP_EQUALVERIFY",
     o4: "OP_CHECKSIG",
     val: 1000
   }
 ])
```

### 3. From transaction hex

```
 let tx = bitpacket.tx(
   "010000000001e8030000000000001976a91451e928263591749c1a8cf7271ef261a74e2aeaf388ac00000000"
 )
```

### 4. Including raw script hex

```
let tx = bitpacket.tx([
	"006a0b48656c6c6f20776f726c64",
	"006a0b48656c6c6f20776f726c64"
])
```

