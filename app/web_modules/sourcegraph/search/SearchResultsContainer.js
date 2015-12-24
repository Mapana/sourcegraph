import React from "react";

import Container from "sourcegraph/Container";
import Dispatcher from "sourcegraph/Dispatcher";
import Pagination from "sourcegraph/util/Pagination";
import SearchResultsStore from "sourcegraph/search/SearchResultsStore";
import * as SearchActions from "sourcegraph/search/SearchActions";
import TokenSearchResults from "sourcegraph/search/TokenSearchResults";
import TextSearchResults from "sourcegraph/search/TextSearchResults";
import SearchFrameResults from "sourcegraph/search/SearchFrameResults";

import "sourcegraph/search/SearchBackend";

class ResultType {
	constructor(label, name, icon, perPage, component) {
		this.label = label;
		this.name = name;
		this.icon = icon;
		this.perPage = perPage;
		this.component = component;
	}
}

let resultTypes = [
	new ResultType("tokens", "Definitions", "asterisk", 50, TokenSearchResults),
	new ResultType("text", "Text", "code", 10, TextSearchResults),
];

let searchFrames = window.searchFrames || {};
Object.getOwnPropertyNames(searchFrames).forEach((key) => {
	let frame = searchFrames[key];
	resultTypes.push(new ResultType(frame.ID, frame.Name, frame.Icon, frame.PerPage, SearchFrameResults));
});

class SearchResultsContainer extends Container {
	constructor(props) {
		super(props);
		this.state = {
			currentType: resultTypes[0],
		};
		this._onPageChange = this._onPageChange.bind(this);
	}
	stores() {
		return [SearchResultsStore];
	}

	reconcileState(state, props) {
		Object.assign(state, props);
		state.results = SearchResultsStore.results;
		state.currentType = resultTypes.find((type) => type.label === props.type);
	}

	onStateTransition(prevState, nextState) {
		if (nextState.query !== prevState.query) {
			// When initiating a new search query, scroll to top of page to
			// view new results.
			if (typeof window !== "undefined") window.scrollTo(0, 0); // TODO(autotest) support window object.
			for (let type of resultTypes) {
				let initialPage = type.label === nextState.currentType.label ? nextState.page : 1;
				Dispatcher.asyncDispatch(
					new SearchActions.WantResults(nextState.repo, nextState.rev, type.label, initialPage, type.perPage, nextState.query)
				);
			}
		} else if (nextState.page !== prevState.page) {
			if (typeof window !== "undefined") window.scrollTo(0, 0); // TODO(autotest) support window object.
			Dispatcher.asyncDispatch(
				new SearchActions.WantResults(nextState.repo, nextState.rev, nextState.currentType.label, nextState.page, nextState.currentType.perPage, nextState.query)
			);
		}
	}

	_onPageChange(page) {
		Dispatcher.dispatch(new SearchActions.SelectPage(page));
	}

	render() {
		let currentResult = this.state.results.get(this.state.repo, this.state.rev, this.state.query, this.state.currentType.label, this.state.page);

		return (
			<div className="search-results row">
				<div className="col-md-10 col-md-offset-1">
					<ul className="nav nav-pills">
						{resultTypes.map((type) => {
							let results = this.state.results.get(this.state.repo, this.state.rev, this.state.query, type.label, type.label === this.state.currentType.label ? this.state.page : 1);
							return (
								<li key={type.label} className={type.label === this.state.currentType.label ? "active" : null}>
									<a onClick={() => {
										Dispatcher.dispatch(new SearchActions.SelectResultType(type.label));
									}}>
										<i className={`fa fa-${type.icon}`}></i> {type.name} <span className="badge">{results ? results.Total : <i className="fa fa-circle-o-notch fa-spin"></i>}</span>
									</a>
								</li>
							);
						})}
					</ul>
					{currentResult &&
						<this.state.currentType.component
							repo={this.state.repo}
							rev={this.state.rev}
							query={this.state.query}
							page={this.state.page}
							label={this.state.currentType.label}
							resultData={currentResult}
							currentPage={this.state.page} />
					}
				</div>
				{(currentResult && currentResult.Total) ?
					<div className="search-pagination">
						<Pagination
							currentPage={this.state.page}
							totalPages={Math.ceil(currentResult.Total/this.state.currentType.perPage)}
							pageRange={10}
							onPageChange={this._onPageChange} />
					</div> : null
				}
			</div>
		);
	}
}

SearchResultsContainer.propTypes = {
	repo: React.PropTypes.string,
	rev: React.PropTypes.string,
	type: React.PropTypes.string,
	query: React.PropTypes.string,
	page: React.PropTypes.number,
};

export default SearchResultsContainer;
