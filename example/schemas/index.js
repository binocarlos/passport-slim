var mongoose = require('mongoose')
var Schema = mongoose.Schema

const UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  username: { type: String, default: '' },
  hashed_password: { type: String, default: '' },
  salt: { type: String, default: '' },
  data: {
    type:Schema.Types.Mixed,
    default:{}
  }
})

module.exports = {
  users:mongoose.model('users', UserSchema)
}