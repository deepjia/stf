var util = require('util')

var Promise = require('bluebird')
var syrup = require('syrup')

var logger = require('../../../util/logger')
var pathutil = require('../../../util/pathutil')
var devutil = require('../../../util/devutil')
var streamutil = require('../../../util/streamutil')

module.exports = syrup()
  .dependency(require('../support/adb'))
  .dependency(require('../support/properties'))
  .define(function(options, adb, properties) {
    var log = logger.createLogger('device:resources:remote')

    var resources = {
      bin: {
        src: pathutil.vendor(util.format(
          'remote/libs/%s/remote'
        , properties['ro.product.cpu.abi']
        ))
      , dest: '/data/local/tmp/remote'
      , comm: 'remote'
      , mode: 0755
      }
    , lib: {
        src: pathutil.vendor(util.format(
          'remote/external/android-%d/remote_external.so'
        , properties['ro.build.version.sdk']
        ))
      , dest: '/data/local/tmp/remote_external.so'
      , mode: 0755
      }
    }

    function installResource(res) {
      return adb.push(options.serial, res.src, res.dest, res.mode)
        .then(function(transfer) {
          return new Promise(function(resolve, reject) {
            transfer.on('error', reject)
            transfer.on('end', resolve)
          })
        })
        .return(res)
    }

    function ensureNotBusy(res) {
      return adb.shell(options.serial, [res.dest, '--help'])
        .then(function(out) {
          // Can be "Text is busy", "text busy"
          return streamutil.findLine(out, (/busy/i))
            .then(function(line) {
              log.info('Binary is busy, will retry')
              return Promise.delay(100)
            })
            .then(function() {
              return ensureNotBusy(res)
            })
            .catch(streamutil.NoSuchLineError, function() {
              return res
            })
        })
    }

    function installAll() {
      return Promise.all([
        installResource(resources.bin).then(ensureNotBusy)
      , installResource(resources.lib)
      ])
    }

    function stop() {
      return devutil.killProcsByComm(
        adb
      , options.serial
      , resources.bin.comm
      , resources.bin.dest
      )
    }

    return stop()
      .then(installAll)
      .then(function() {
        return {
          bin: resources.bin.dest
        , lib: resources.lib.dest
        }
      })
  })