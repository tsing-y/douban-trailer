const cp = require('child_process')
const resolve_dir = require('path').resolve
const mongoose = require('mongoose')
const Movie = mongoose.model('Movie')

module.exports = async () => {
  return new Promise(async (resolve, reject) => {
    const script = resolve_dir(__dirname, '../crawler/trailer-list')
    const child = cp.fork(script, [])
    let invoked = false

    child.on('error', err => {
      if (invoked) return
      invoked = true
      console.log(err)
      reject(err)
    })
    child.on('exit', code => {
      if (invoked) return

      invoked = true
      let err = code === 0 ? null : new Error('exit code ' + code)
      if (err) {
        console.log(err)
        reject(err)
      }
    })
    child.on('message', data => {
      let result = data.result
      console.log(result)
      result.forEach(async item => {
        let movie = await Movie.findOne({
          doubanId: item.doubanId
        })
        if (!movie) {
          movie = new Movie(item)
          await movie.save()
        }
      })
      resolve()
    })
  })
}
