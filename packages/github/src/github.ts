import * as Context from './context'
import {OctokitOptions, Constructor} from '@octokit/core/dist-types/types'
import * as Utils from './internal/utils'

// octokit + plugins
import {Octokit as Core} from '@octokit/core'
import {restEndpointMethods} from '@octokit/plugin-rest-endpoint-methods'
import {paginateRest} from '@octokit/plugin-paginate-rest'
import {
  enterpriseServer220Admin,
  enterpriseServer220
} from '@octokit/plugin-enterprise-server'

export const context = new Context.Context()

class GitHubCore extends Core {
  /* eslint-disable no-dupe-class-members */
  // Disable no-dupe-class-members due to false positive for method overload
  // https://github.com/typescript-eslint/typescript-eslint/issues/291

  /**
   * Sets up the REST client and GraphQL client with auth and proxy support.
   * The parameter `token` or `opts.auth` must be supplied. The GraphQL client
   * authorization is not setup when `opts.auth` is a function or object.
   *
   * @param token  Auth token
   * @param opts   Octokit options
   */
  constructor(token: string, opts?: Omit<OctokitOptions, 'auth'>)
  constructor(opts: OctokitOptions)
  constructor(token: string | OctokitOptions, opts?: OctokitOptions) {
    super(Utils.getOctokitOptions(Utils.disambiguate(token, opts)))
    this.graphql = Utils.getGraphQL(Utils.disambiguate(token, opts))
  }

  // Base class assumes the octokit options are at position 0, that is not the case for us, so we need to reimplement
  static defaults<T extends Constructor<any>>(
    this: T,
    defaults: OctokitOptions
  ): T {
    const GitHubWithDefaults = class extends this {
      constructor(...args: any[]) {
        const token = args[0]
        const opts = args[1]
        const options = Utils.getOctokitOptions(Utils.disambiguate(token, opts))
        super(Object.assign({}, defaults, options))
      }
    }
    return GitHubWithDefaults
  }
}

const baseUrl = Utils.getApiBaseUrl()
const defaults = {
  baseUrl,
  request: {
    agent: Utils.getProxyAgent(baseUrl)
  }
}

export const GitHub = GitHubCore.plugin(
  paginateRest,
  restEndpointMethods
).defaults(defaults)

export const GitHubEnterprise = GitHubCore.plugin(
  paginateRest,
  enterpriseServer220Admin,
  enterpriseServer220
).defaults(defaults)
