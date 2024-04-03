let nextWorkOfUnit = null
let wipRoot = null
let currentRoot = null


function createTextNode(item) {
  return {
    type: 'text',
    props: {
      nodeValue: item,
      children: []
    }
  }
}
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(item => {
        if(typeof item === 'string' || typeof item === 'number') {
          return createTextNode(item)
        } else {
          return item
        }
      })
    }
  }
}
function createDom(el) {
  let ele = ''
  if(el.type === 'text') {
    ele =  document.createTextNode(el.props.nodeValue)
  }else{
    ele =  document.createElement(el.type)
  }
  return ele
}
function performNextFiber(fiber) {
  const isFunction = typeof fiber.type === 'function'

  if(!isFunction && !fiber.dom) {
    fiber.dom = createDom(fiber)
    updateProps(fiber.dom, fiber.props, {})
  }
  if(isFunction) {
    const fnFiber  = fiber.type(fiber.props)
    const children = [fnFiber]
    reconcileChildren(fiber, children)
  }else{
    const children = fiber.props.children
    reconcileChildren(fiber, children)
  }
  if(fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while(nextFiber) {
    if(nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}
function reconcileChildren(fiber, children) {
  // dom parent child sibling
  let oldFiber = fiber.alternate?.child
  let newFiber;
  let prevFiber;
  children.forEach((child,i) => {
    const isSameType =  oldFiber && oldFiber.type === child.type
    if(isSameType) {
      newFiber = {
        dom: oldFiber.dom,
        type: child.type,
        props: child.props,
        parent: fiber,
        child: null,
        sibling: null,
        effect: 'update',
        alternate: oldFiber
      }
    } else {
      newFiber = {
        dom: null,
        type: child.type,
        props: child.props,
        parent: fiber,
        child: null,
        sibling: null,
        effect: 'placeholder',
        alternate: null
      }
    }
    if(i === 0) {
      fiber.child = newFiber
    }else{
      prevFiber.sibling = newFiber
    }
    if(oldFiber) {
      oldFiber = oldFiber.sibling
    }
    prevFiber = newFiber
  })
}

function workLoop(deadline) {
  let shouldYield = true
  while(nextWorkOfUnit && shouldYield) {
    nextWorkOfUnit = performNextFiber(nextWorkOfUnit)
    shouldYield = deadline.timeRemaining() > 1
  }
  if(!nextWorkOfUnit && wipRoot) {
    commitRoot(wipRoot)
    currentRoot = wipRoot
    wipRoot = null
  }
  requestIdleCallback(workLoop)
}
function commitRoot(fiber) {
  commitWork(fiber.child)
}
function commitWork(fiber) {
  if(!fiber) return
  if(fiber.effect === 'placeholder') {
    let fiberParent = fiber.parent
    while(!fiberParent.dom) {
      fiberParent = fiberParent.parent
    }
    if(fiber.dom) {
      fiberParent.dom.appendChild(fiber.dom)
    }
  }else if(fiber.effect === 'update'){
    updateProps(fiber.dom, fiber.props, fiber.alternate.props)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
requestIdleCallback(workLoop)

function createRoot(container) {
  return {
    render(el) {
      render(el, container)
    }
  }
}

function updateProps(dom, nextProps, prevProps) {
  // 1. 老的有 新的没有
  Object.keys(prevProps).filter(item => item !== 'children').forEach(item => {
    if(!nextProps[item]) {
      dom.removeAttribute(item);
    }
  })
  // 2. 新的有 老的没有
  // 3. 新的有 老的也有
  Object.keys(nextProps).filter(item => item !== 'children').forEach(item => {
    if(nextProps[item] !== prevProps[item]) {
      if(item.startsWith('on')) {
        const eventName = item.slice(2)
        dom.removeEventListener(eventName.toLowerCase(), prevProps[item], false)
        dom.addEventListener(eventName.toLowerCase(), nextProps[item], false)
      }else{
        dom[item] = nextProps[item]
      }
    }
  })
}

function update() {
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot
  }
  nextWorkOfUnit = wipRoot
}

function render(el, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [el]
    }
  }
  nextWorkOfUnit = wipRoot
}

export default {
  update,
  createRoot,
  createElement
}