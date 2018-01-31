import { css } from 'vuikit/core/util/style'
import { warn } from 'vuikit/core/util/debug'
import { addClass } from 'vuikit/core/util/class'
import { on, off, offAll } from 'vuikit/core/util/dom/event'
import { positionAt, flipPosition } from 'vuikit/core/util/position'
import { get, includes, debounce, isObject, isString, toInteger, isUndefined } from 'vuikit/core/util/lang'

let uid = 'v-position'

const positions = [
  'top-left',
  'top-center',
  'top-right',

  'bottom-left',
  'bottom-center',
  'bottom-right',

  'left-top',
  'left-center',
  'left-bottom',

  'right-top',
  'right-center',
  'right-bottom'
]

export default {
  inserted (el, binding, vnode) {
    const ctx = getContext(el, binding, vnode)

    if (ctx) {
      position(ctx)
    }
  },
  componentUpdated (el, binding, vnode) {
    const ctx = getContext(el, binding, vnode)

    if (ctx) {
      position(ctx)
    }
  },
  unbind (el, binding, vnode) {
    offAll(uid)
  }
}

function position (ctx) {
  const { el, props, vnode } = ctx
  const { target, position, offset, boundary, flip, classPrefix } = props

  if (!includes(positions, position)) {
    warn('Invalid v-position position', vnode)
  }

  let [dir, align] = position.split('-')

  // remove any position class
  const classesRx = new RegExp(`${classPrefix}-(top|bottom|left|right)(-[a-z]+)?`)
  el.className = el.className.replace(classesRx, '')

  // reset pos
  css(el, { top: '', left: '' })

  const axis = getPositionAxis(position)

  const elAttach = axis === 'x'
    ? `${flipPosition(dir)} ${align}`
    : `${align} ${flipPosition(dir)}`

  const targetAttach = axis === 'x'
    ? `${dir} ${align}`
    : `${align} ${dir}`

  const elOffset = axis === 'x'
    ? `${dir === 'left' ? -1 * offset : offset}`
    : ` ${dir === 'top' ? -1 * offset : offset}`

  const targetOffset = null
  const { x, y } = positionAt(
    el,
    target,
    elAttach,
    targetAttach,
    elOffset,
    targetOffset,
    flip,
    boundary
  ).target

  dir = axis === 'x' ? x : y
  align = axis === 'x' ? y : x

  // add on resize events
  setResizeEvent(ctx)

  // add position class
  if (classPrefix) {
    addClass(el, `${classPrefix}-${dir}-${align}`)
  }
}

/**
 * Get the directive props
**/
function getProps (ctx) {
  const { vnode } = ctx
  const { value } = ctx.binding

  if (isUndefined(value) || !isObject(value)) {
    warn('v-position configuration is missing or is not an Object', vnode.context)
    return false
  }

  let target = value.target || null
  const delay = get(value, 'delay', 0)
  const flip = get(value, 'flip', true)
  const classPrefix = get(value, 'classPrefix', 'v-position')
  const boundary = value.boundary || window
  const offset = toInteger(value.offset) || 0
  const position = value.position || 'top-center'

  if (isString(target)) {
    target = vnode.context.$refs[target]
  }

  return { target, delay, offset, flip, position, boundary, classPrefix }
}

function setResizeEvent (ctx) {
  off(window, 'resize', uid)
  on(window, 'resize', debounce(() => {
    position(ctx)
  }, 50), uid)
}

/**
 * Get the context used across
**/
function getContext (el, binding, vnode) {
  const ctx = { el, binding, vnode }
  ctx.props = getProps(ctx)

  if (!ctx.props) {
    binding.def.unbind(el, binding)
    return
  }

  return ctx
}

function getPositionAxis (position) {
  const [dir] = position.split('-')
  return dir === 'top' || dir === 'bottom'
    ? 'y'
    : 'x'
}
