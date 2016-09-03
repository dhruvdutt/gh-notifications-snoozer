const React = require('react')
const Rules = require('../../models/rules')

class Filter extends React.Component {
  changeRule(event) {
    this.props.changeRule(event.target.value)
  }

  refresh(event) {
    event.currentTarget.blur() // defocus button
    const rule = document.getElementById('rules-select').value
    this.props.changeRule(rule)
  }

  render() {
    const rules = Rules.findAll()
    return (
      <div className="filter columns">
        <div className="column is-6">
          <label className="label" htmlFor="rules-select">Filter:</label>
          <span className="select">
            <select id="rules-select" onChange={event => this.changeRule(event)}>
              {rules.map(ruleKey => (
                <option key={ruleKey} value={ruleKey}>
                  {ruleKey}
                </option>
              ))}
            </select>
          </span>
          <button
            onClick={e => this.refresh(e)}
            type="button"
            title="Refresh list"
            className="is-link button"
          >
            <span className="octicon octicon-sync"></span>
          </button>
        </div>
        <div className="column is-6 has-text-right">
          <button onClick={this.props.manageRules} type="button" className="is-link button">
            Manage filters
          </button>
          <button onClick={this.props.addRule} type="button" className="is-link button">
            Add a filter
          </button>
        </div>
      </div>
    )
  }
}

Filter.propTypes = {
  addRule: React.PropTypes.func.isRequired,
  changeRule: React.PropTypes.func.isRequired,
  manageRules: React.PropTypes.func.isRequired,
}

module.exports = Filter
