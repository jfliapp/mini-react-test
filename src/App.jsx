import React from '../core/ReactDOM.js'
// const App = MReact.createElement('div', {id: 1, onClick: a}, num.name, 'dd',MReact.createElement('p', {}, MReact.createElement('span', {title: 'aaa'}, 'aaa'))) 

let str = 'num'
let num = 2
function Counter() {
  function a() {
    str = 'xx'
    num++
    React.update()
  }
  return (<div onClick={a}>
    <p>{str}</p>
    <p>{num}</p>
  </div>)
}
let props = {id: 'xxxxx'}
function App() {
  function del() {
    props = {}
    React.update()
  }
  return (
    <div {...props}>
      xx,
      <Counter count="1"></Counter>
      <button onClick={() => del()}>del</button>
    </div>
  )
}
export default App
