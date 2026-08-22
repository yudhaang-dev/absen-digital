import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//127.0.0.1'
 */
const Controller2a80f08d0df58fa433c69ac3aa1d3ed3 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller2a80f08d0df58fa433c69ac3aa1d3ed3.url(options),
    method: 'get',
})

Controller2a80f08d0df58fa433c69ac3aa1d3ed3.definition = {
    methods: ["get","head"],
    url: '//127.0.0.1',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//127.0.0.1'
 */
Controller2a80f08d0df58fa433c69ac3aa1d3ed3.url = (options?: RouteQueryOptions) => {
    return Controller2a80f08d0df58fa433c69ac3aa1d3ed3.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//127.0.0.1'
 */
Controller2a80f08d0df58fa433c69ac3aa1d3ed3.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller2a80f08d0df58fa433c69ac3aa1d3ed3.url(options),
    method: 'get',
})
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//127.0.0.1'
 */
Controller2a80f08d0df58fa433c69ac3aa1d3ed3.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller2a80f08d0df58fa433c69ac3aa1d3ed3.url(options),
    method: 'head',
})

    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//127.0.0.1'
 */
    const Controller2a80f08d0df58fa433c69ac3aa1d3ed3Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: Controller2a80f08d0df58fa433c69ac3aa1d3ed3.url(options),
        method: 'get',
    })

            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//127.0.0.1'
 */
        Controller2a80f08d0df58fa433c69ac3aa1d3ed3Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: Controller2a80f08d0df58fa433c69ac3aa1d3ed3.url(options),
            method: 'get',
        })
            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//127.0.0.1'
 */
        Controller2a80f08d0df58fa433c69ac3aa1d3ed3Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: Controller2a80f08d0df58fa433c69ac3aa1d3ed3.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    Controller2a80f08d0df58fa433c69ac3aa1d3ed3.form = Controller2a80f08d0df58fa433c69ac3aa1d3ed3Form
    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//localhost'
 */
const Controller40102f8ba8a8f35e50b49105710bb6ee = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller40102f8ba8a8f35e50b49105710bb6ee.url(options),
    method: 'get',
})

Controller40102f8ba8a8f35e50b49105710bb6ee.definition = {
    methods: ["get","head"],
    url: '//localhost',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//localhost'
 */
Controller40102f8ba8a8f35e50b49105710bb6ee.url = (options?: RouteQueryOptions) => {
    return Controller40102f8ba8a8f35e50b49105710bb6ee.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//localhost'
 */
Controller40102f8ba8a8f35e50b49105710bb6ee.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controller40102f8ba8a8f35e50b49105710bb6ee.url(options),
    method: 'get',
})
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//localhost'
 */
Controller40102f8ba8a8f35e50b49105710bb6ee.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controller40102f8ba8a8f35e50b49105710bb6ee.url(options),
    method: 'head',
})

    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//localhost'
 */
    const Controller40102f8ba8a8f35e50b49105710bb6eeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: Controller40102f8ba8a8f35e50b49105710bb6ee.url(options),
        method: 'get',
    })

            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//localhost'
 */
        Controller40102f8ba8a8f35e50b49105710bb6eeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: Controller40102f8ba8a8f35e50b49105710bb6ee.url(options),
            method: 'get',
        })
            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//localhost'
 */
        Controller40102f8ba8a8f35e50b49105710bb6eeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: Controller40102f8ba8a8f35e50b49105710bb6ee.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    Controller40102f8ba8a8f35e50b49105710bb6ee.form = Controller40102f8ba8a8f35e50b49105710bb6eeForm
    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//absen.digital.test'
 */
const Controllere023290ea0ac92ed2860f32876fd4924 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllere023290ea0ac92ed2860f32876fd4924.url(options),
    method: 'get',
})

Controllere023290ea0ac92ed2860f32876fd4924.definition = {
    methods: ["get","head"],
    url: '//absen.digital.test',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//absen.digital.test'
 */
Controllere023290ea0ac92ed2860f32876fd4924.url = (options?: RouteQueryOptions) => {
    return Controllere023290ea0ac92ed2860f32876fd4924.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//absen.digital.test'
 */
Controllere023290ea0ac92ed2860f32876fd4924.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: Controllere023290ea0ac92ed2860f32876fd4924.url(options),
    method: 'get',
})
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//absen.digital.test'
 */
Controllere023290ea0ac92ed2860f32876fd4924.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: Controllere023290ea0ac92ed2860f32876fd4924.url(options),
    method: 'head',
})

    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//absen.digital.test'
 */
    const Controllere023290ea0ac92ed2860f32876fd4924Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: Controllere023290ea0ac92ed2860f32876fd4924.url(options),
        method: 'get',
    })

            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//absen.digital.test'
 */
        Controllere023290ea0ac92ed2860f32876fd4924Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: Controllere023290ea0ac92ed2860f32876fd4924.url(options),
            method: 'get',
        })
            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '//absen.digital.test'
 */
        Controllere023290ea0ac92ed2860f32876fd4924Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: Controllere023290ea0ac92ed2860f32876fd4924.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    Controllere023290ea0ac92ed2860f32876fd4924.form = Controllere023290ea0ac92ed2860f32876fd4924Form

/**
* Multiple routes resolve to \Inertia\Controller::Controller, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `Controller['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
const Controller = {
    '//127.0.0.1': Controller2a80f08d0df58fa433c69ac3aa1d3ed3,
    '//localhost': Controller40102f8ba8a8f35e50b49105710bb6ee,
    '//absen.digital.test': Controllere023290ea0ac92ed2860f32876fd4924,
}

export default Controller