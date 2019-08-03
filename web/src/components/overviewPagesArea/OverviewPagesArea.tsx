import H from 'history'
import MapSearchIcon from 'mdi-react/MapSearchIcon'
import React from 'react'
import { Route, Switch } from 'react-router'
import { RouteDescriptor } from '../../util/contributions'
import { ErrorBoundary } from '../ErrorBoundary'
import { HeroPage } from '../HeroPage'
import { OverviewPagesAreaNavbar } from './navbar/OverviewPagesAreaNavbar'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'

/**
 * @template P The props passed to the subcomponents of the {@link OverviewPagesArea}.
 */
export interface OverviewPagesAreaPage<P extends object> extends RouteDescriptor<P> {
    title: string
    icon?: React.ComponentType<{ className?: string }>
    count?: number
}

interface Props<P extends object> {
    /**
     * The props passed to subcomponents of the {@link OverviewPagesArea}.
     */
    context: P

    /**
     * A fragment rendered above the overview.
     */
    header: React.ReactFragment

    /**
     * The overview, which is shown above the page tab bar.
     */
    overviewComponent: React.ComponentType<P & { className?: string }>

    /**
     * The pages in this area.
     */
    pages: OverviewPagesAreaPage<P>[]

    /**
     * The base URL of the area.
     */
    match: { url: string }

    className?: string
    location: H.Location
}

/**
 * An area with an overview and sub-pages.
 */
export const OverviewPagesArea = <P extends object>({
    context,
    header,
    overviewComponent: OverviewComponent,
    pages: conditionalPages,
    className = '',
    match,
    location,
}: Props<P>): React.ReactElement<Props<P>> => {
    const pages = conditionalPages.filter(
        (page): page is Pick<typeof page, Exclude<keyof typeof page, 'condition'>> =>
            !page.condition || page.condition(context)
    )
    return (
        <div className={`overview-pages-area flex-1 d-flex overflow-hidden ${className}`}>
            <div className="d-flex flex-column flex-1 overflow-auto">
                <ErrorBoundary location={location}>
                    <div className="container">
                        {header}
                        <OverviewComponent {...context} className="pb-3" />
                    </div>
                    <div className="w-100 border-bottom" />
                    <OverviewPagesAreaNavbar areaUrl={match.url} pages={pages} className="flex-0 sticky-top bg-body" />
                </ErrorBoundary>
                <ErrorBoundary location={location}>
                    <React.Suspense fallback={<LoadingSpinner className="icon-inline m-2" />}>
                        <Switch>
                            {pages.map((page, i) => (
                                <Route
                                    key={i}
                                    path={`${match.url}${page.path}`}
                                    exact={page.exact}
                                    // tslint:disable-next-line: jsx-no-lambda
                                    render={routeComponentProps => page.render({ ...routeComponentProps, ...context })}
                                />
                            ))}
                            <Route>
                                <HeroPage
                                    icon={MapSearchIcon}
                                    title="404: Not Found"
                                    subtitle="Sorry, the requested page was not found."
                                />
                            </Route>
                        </Switch>
                    </React.Suspense>
                </ErrorBoundary>
            </div>
        </div>
    )
}