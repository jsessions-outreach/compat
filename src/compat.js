let fs = require('fs')
let check = require('./check.js')
let js = require('./js/index.js')
let html = require('./html/index.js')

function isEnvDefined (envTable, env) {
  return Object.keys(envTable).some((envGroupId) => {
    return Object.keys(envTable[envGroupId]).some((definedEnvId) => env === definedEnvId)
  })
}

exports.getSupportedEnvs = (compatTableLocation) => {
  return require(compatTableLocation).envs
}

exports.getUndefinedEnvs = (compatTableLocation, envs) => {
  const envTable = require(compatTableLocation).envs

  return envs.filter((envId) => {
    return !isEnvDefined(envTable, envId)
  })
}

exports.getSupportedFeatures = () => {
  let obj = {}

  obj[js.name] = js.getSupportedFeatures()
  obj[html.name] = html.getSupportedFeatures()

  return obj
}

exports.getSupportedFeatureGroups = () => {
  let obj = {}

  obj[js.name] = js.getSupportedFeatureGroups()
  obj[html.name] = html.getSupportedFeatureGroups()

  return obj
}

exports.getEnabledFeatures = (features, ignoreFeatures) => {
  let obj = {}

  obj[js.name] = js.getEnabledFeatures(features, ignoreFeatures)
  obj[html.name] = html.getEnabledFeatures(features, ignoreFeatures)

  return obj
}

exports.check = (targets, envs, features, ignoreFeatures, compatTableLocation) => {
  const envTable = require(compatTableLocation).envs

  const definedEnvs = envs.filter((envId) => {
    return isEnvDefined(envTable, envId)
  })

  const jsFeaturesToDetect = js.getEnabledFeatures(features, ignoreFeatures)
  const htmlFeaturesToDetect = html.getEnabledFeatures(features, ignoreFeatures)

  let obj = {}
  targets.forEach((fileName) => {
    let fileContents = fs.readFileSync(fileName, 'utf8')
    let usedFeatures = {}

    if (fileName.match(js.fileRegex)) {
      let jsFeatures = js.check(fileContents, jsFeaturesToDetect)
      Object.assign(usedFeatures, jsFeatures)
    }

    if (fileName.match(html.fileRegex)) {
      let htmlFeatures = html.check(fileContents, htmlFeaturesToDetect)
      Object.assign(usedFeatures, htmlFeatures)
    }

    const errors = check.checkFeatureCompatibility(usedFeatures, definedEnvs, compatTableLocation)
    if (Object.keys(errors).length > 0) {
      obj[fileName] = errors
    }
  })

  return obj
}
