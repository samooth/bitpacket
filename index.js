const bsv = require('bsv2')
const _Buffer = bsv.deps.Buffer
const _parse = (o) => {
  return Object.keys(o).filter((k) => {
    return k !== 'val'
  }).sort((a, b) => {
    return parseInt(a.slice(1)) - parseInt(b.slice(1))
  }).map((k) => {
    return { key: k, val: o[k] }
  })
}
const _transform = (chunks) => {
  if (chunks.pkh) {
    return { o0: "OP_DUP", o1: "OP_HASH160", h2: chunks.pkh, o3: "OP_EQUALVERIFY", o4: "OP_CHECKSIG", val: chunks.val }
  } else if (chunks.address) {
    return _transform({ pkh: new bsv.Address().fromString(chunks.address).hashBuf.toString("hex") })
  }
  return chunks
}
const _script = (chunks) => {
  let s = new bsv.Script()
  if (chunks.script) {
    let buf;
    if (chunks.script.constructor.name === 'ArrayBuffer') {
      buf = a2b(chunks.script) 
    } else if (chunks.script.constructor.name === 'Buffer') {
      buf = chunks.script
    } else {
      buf = Buffer.from(chunks.script, "hex")
    }
    s.fromBuffer(buf)
  } else {
    let processed = _transform(chunks)
    let sorted = _parse(processed)
    for(let item of sorted) {
      if (item.key.startsWith("s")) {
        let buf = Buffer.from(item.val)
        s.writeBuffer(buf)
      } else if (item.key.startsWith("h")) {
        let buf = Buffer.from(item.val, "hex")
        s.writeBuffer(buf)
      } else if (item.key.startsWith("b")) {
        if (item.val.constructor.name === 'ArrayBuffer') {
          let buffer = _Buffer.Buffer.from(item.val)
          s.writeBuffer(buffer)
        } else if (item.val.constructor.name === 'Buffer') {
          s.writeBuffer(item.val)
        } else if (typeof item.val === 'string') {
          let buf = Buffer.from(item.val, "base64")
          s.writeBuffer(buf)
        }
      } else if (item.key.startsWith("o")) {
        s.writeOpCode(bsv.OpCode[item.val])
      }
    }
  }
  return s;
}
const b2a = (buf) => {
  return buf.buffer.slice(o[key].byteOffset, buf.byteOffset + buf.byteLength)
}
const a2b = (arraybuf) => {
  return _Buffer.Buffer.from(arraybuf)
}
const project = (o, filter) => {
  if (filter) {
    let x = {}
    for(let key in filter) {
      if (key.startsWith("b")) {
        if (typeof filter[key] === 'string' && filter[key].toLowerCase() === 'arraybuffer') {
          x[key] = o[key].buffer.slice(o[key].byteOffset, o[key].byteOffset + o[key].byteLength)
        } else if (typeof filter[key] === 'string' && filter[key].toLowerCase() === 'buffer') {
          x[key] = o[key]
        } else if (typeof filter[key] === 'string' && filter[key].toLowerCase() === 'base64') {
          x[key] = o[key].toString("base64")
        } else {
          x[key] = o[key]
        }
      } else if (key.startsWith("s")) {
        if (typeof filter[key] === 'string' && filter[key].toLowerCase() === 'json') {
          try {
            x[key] = JSON.parse(o[key])
          } catch (e) {
            x[key] = o[key]
          }
        } else {
          x[key] = o[key]
        }
      } else {
        x[key] = o[key]
      }
    }
    return x;
  } else {
    return o
  }
}
const inspect = (data) => {
  if (data.script) {
    let className = data.script.constructor.name.toLowerCase()
    if (className === 'script') {
      let sequence = {}
      data.script.chunks.forEach((chunk, i) => {
        if (typeof chunk === 'object' && chunk.hasOwnProperty("buf")) {
          let buf = chunk.buf;
          sequence["b" + i] = buf;
          sequence["h"+i] = buf.toString("hex"),
          sequence["s"+i] = buf.toString()
        } else if (typeof chunk === 'object' && chunk.hasOwnProperty("opCodeNum")) {
          let opcode = bsv.OpCode.fromNumber(chunk.opCodeNum).toString()
          sequence["o" + i] = opcode
        }
      })
      let projected = project(sequence, data.project)
      return projected
    } else if (className === 'string') {
      // raw hex
      let s = new bsv.Script().fromBuffer(Buffer.from(data.script, "hex"))
      return inspect({ script: s })
    }
  } else if (data.tx) {
    let className = data.tx.constructor.name.toLowerCase()
    if (className === 'tx') {
      let res = data.tx.txOuts.map((out, i) => {
        let o = inspect({ script: out.script })
        o.val = out.valueBn.toNumber()
        return o
      })
      if (data.project && Array.isArray(data.project) && data.project.length === res.length) {
        let projected = res.map((r, i) => {
          return project(r, data.project[i])
        })
        return {
          id: data.tx.id(),
          out: projected
        }
      } else {
        return {
          id: data.tx.id(),
          out: res
        }
      }
    } else if (className === 'string') {
      // raw hex
      let t = new bsv.Tx().fromBuffer(Buffer.from(data.tx, "hex"))
      if (data.project) {
        return inspect({ tx: t, project: data.project })
      } else {
        return inspect({ tx: t })
      }
    }
  }
}
const script = (s) => {
  if (Array.isArray(s)) {
    return s.map((x) => { return _script(x) })
  } else if (typeof s === 'object') {
    return _script(s)
  } else {
    return _script({ script: s })
  }
}
const tx = (scripts) => {
  if (Array.isArray(scripts)) {
    const t = new bsv.Tx()
    for(let chunks of scripts) {
      let val = chunks.val ? chunks.val : 0
      let s = script(chunks)
      t.addTxOut(new bsv.Bn(val), s)
    }
    return t;
  } else {
    let buf;
    if (scripts.constructor.name === 'ArrayBuffer') {
      buf = a2b(scripts) 
    } else if (scripts.constructor.name === 'Buffer') {
      buf = scripts
    } else {
      buf = Buffer.from(scripts, "hex")
    }
    return new bsv.Tx().fromBuffer(buf)
  }
}
module.exports = {
  inspect: inspect,
  script: script,
  tx: tx,
  bsv: bsv
}
