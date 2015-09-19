
import index from './routes/index'
import exp from './routes/exp'
import slack from './routes/slack'

export default {
  '/': index,
  '/exp': exp,
  '/slack': slack
}
