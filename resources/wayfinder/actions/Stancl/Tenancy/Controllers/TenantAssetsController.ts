import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults, validateParameters } from './../../../../wayfinder'
/**
* @see \Stancl\Tenancy\Controllers\TenantAssetsController::asset
 * @see vendor/stancl/tenancy/src/Controllers/TenantAssetsController.php:20
 * @route '/tenancy/assets/{path?}'
 */
export const asset = (args?: { path?: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: asset.url(args, options),
    method: 'get',
})

asset.definition = {
    methods: ["get","head"],
    url: '/tenancy/assets/{path?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Stancl\Tenancy\Controllers\TenantAssetsController::asset
 * @see vendor/stancl/tenancy/src/Controllers/TenantAssetsController.php:20
 * @route '/tenancy/assets/{path?}'
 */
asset.url = (args?: { path?: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { path: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    path: args[0],
                }
    }

    args = applyUrlDefaults(args)

    validateParameters(args, [
            "path",
        ])

    const parsedArgs = {
                        path: args?.path,
                }

    return asset.definition.url
            .replace('{path?}', parsedArgs.path?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \Stancl\Tenancy\Controllers\TenantAssetsController::asset
 * @see vendor/stancl/tenancy/src/Controllers/TenantAssetsController.php:20
 * @route '/tenancy/assets/{path?}'
 */
asset.get = (args?: { path?: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: asset.url(args, options),
    method: 'get',
})
/**
* @see \Stancl\Tenancy\Controllers\TenantAssetsController::asset
 * @see vendor/stancl/tenancy/src/Controllers/TenantAssetsController.php:20
 * @route '/tenancy/assets/{path?}'
 */
asset.head = (args?: { path?: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: asset.url(args, options),
    method: 'head',
})

    /**
* @see \Stancl\Tenancy\Controllers\TenantAssetsController::asset
 * @see vendor/stancl/tenancy/src/Controllers/TenantAssetsController.php:20
 * @route '/tenancy/assets/{path?}'
 */
    const assetForm = (args?: { path?: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: asset.url(args, options),
        method: 'get',
    })

            /**
* @see \Stancl\Tenancy\Controllers\TenantAssetsController::asset
 * @see vendor/stancl/tenancy/src/Controllers/TenantAssetsController.php:20
 * @route '/tenancy/assets/{path?}'
 */
        assetForm.get = (args?: { path?: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: asset.url(args, options),
            method: 'get',
        })
            /**
* @see \Stancl\Tenancy\Controllers\TenantAssetsController::asset
 * @see vendor/stancl/tenancy/src/Controllers/TenantAssetsController.php:20
 * @route '/tenancy/assets/{path?}'
 */
        assetForm.head = (args?: { path?: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: asset.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    asset.form = assetForm
const TenantAssetsController = { asset }

export default TenantAssetsController