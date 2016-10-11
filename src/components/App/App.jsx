const { connect } = require('react-redux')
const React = require('react')
const { ipcRenderer } = require('electron')
const Filter = require('../../models/Filter')
const Filters = require('../../models/Filters')
const GitHub = require('../../models/GitHub')
const AppMenu = require('../../models/AppMenu')
const GitHubAuth = require('../../models/GitHubAuth')
const LastFilter = require('../../models/LastFilter')
const TabbedNav = require('../TabbedNav')
const DefaultFilters = require('../../models/DefaultFilters')
const TaskList = require('../TaskList')
const FilterList = require('../FilterList')
const NewFilter = require('../NewFilter')
const EditFilter = require('../EditFilter')
const About = require('../About')
const Auth = require('../Auth')
const HiddenTaskList = require('../HiddenTaskList')

class App extends React.Component {
  constructor() {
    super()
    const view = GitHubAuth.isAuthenticated() ? 'tasks' : 'auth'
    this.state = { view }
  }

  componentDidMount() {
    ipcRenderer.send('title', 'Tasks')
    this.setupAppMenu()
    if (GitHubAuth.isAuthenticated()) {
      this.loadUser()
      if (this.props.activeFilter) {
        this.loadTasks()
      } else {
        this.manageFilters()
      }
    }
  }

  onUserLoad(user) {
    this.setState({ user })
  }

  setupAppMenu() {
    this.appMenu = new AppMenu({
      isAuthenticated: GitHubAuth.isAuthenticated(),
    })
    this.appMenu.on('about-app', () => {
      this.showAbout()
    })
    this.appMenu.on('authenticate', () => {
      this.showAuth()
    })
    this.appMenu.on('tasks', () => {
      if (GitHubAuth.isAuthenticated()) {
        this.showTaskList()
      }
    })
    this.appMenu.on('filters', () => {
      if (GitHubAuth.isAuthenticated()) {
        this.manageFilters()
      }
    })
  }

  getViewContents() {
    let cancel = () => this.showTaskList()
    if (this.state.previousView === 'filters') {
      cancel = () => this.manageFilters()
    }
    const addFilter = () => this.showNewFilterForm()
    const editFilter = key => this.editFilter(key)
    const manageFilters = () => this.manageFilters()
    const loadFilter = key => this.loadFilter(key)
    switch (this.state.view) {
      case 'tasks': return (
        <TaskList
          addFilter={addFilter}
          changeFilter={loadFilter}
          manageFilters={manageFilters}
          user={this.state.user}
          showAuth={() => this.showAuth()}
          showHidden={() => this.showHidden()}
          editFilter={editFilter}
        />)
      case 'filters': return (
        <FilterList
          delete={filter => this.deleteFilter(filter)}
          edit={editFilter}
          addFilter={addFilter}
          cancel={cancel}
        />)
      case 'edit-filter': return (
        <EditFilter
          filter={this.props.activeFilter}
          cancel={cancel}
        />)
      case 'about': return <About cancel={cancel} />
      case 'new-filter': return (
        <NewFilter
          cancel={cancel}
          manageFilters={manageFilters}
          loadFilter={loadFilter}
        />)
      case 'hidden': return (
        <HiddenTaskList
          cancel={cancel}
          activeFilter={this.state.filter}
        />)
      default: return (
        <Auth
          done={user => this.finishedWithAuth(user)}
          isAuthenticated={GitHubAuth.isAuthenticated()}
          user={this.state.user}
        />
      )
    }
  }

  showAbout() {
    ipcRenderer.send('title', 'About')
    this.changeView('about')
  }

  showAuth() {
    ipcRenderer.send('title', 'Authenticate')
    this.changeView('auth')
  }

  loadTasks() {
    const github = new GitHub()
    github.getNotifications().then(notifications => {
      github.getTasks(this.props.activeFilter.query).then(tasks => {
        this.props.dispatch({ type: 'TASKS_UPDATE', tasks, notifications })
      }).catch(err => {
        console.error('failed to get tasks from GitHub', err)
      })
    }).catch(err => {
      console.error('failed to get notifications from GitHub', err)
    })
  }

  loadUser() {
    const github = new GitHub()
    github.getCurrentUser().then(user => this.onUserLoad(user))
          .catch(error => {
            console.error('failed to load user', error)
            GitHubAuth.deleteToken()
          })
  }

  showNewFilterForm() {
    ipcRenderer.send('title', 'New Filter')
    this.changeView('new-filter')
  }

  showTaskList() {
    ipcRenderer.send('title', 'Tasks')
    this.changeView('tasks')
  }

  loadFilter(filter) {
    this.props.dispatch({ type: 'FILTERS_SELECT', filter })
    this.loadTasks()
  }

  manageFilters() {
    ipcRenderer.send('title', 'Manage Filters')
    this.changeView('filters')
  }

  deleteFilter(filter) {
    this.props.dispatch({ type: 'FILTERS_REMOVE', name: filter.name })
  }

  showHidden() {
    ipcRenderer.send('title', 'Hidden Tasks')
    this.changeView('hidden')
  }

  editFilter(key) {
    this.setState({ filter: key }, () => {
      ipcRenderer.send('title', `Edit Filter ${key}`)
      this.changeView('edit-filter')
    })
  }

  changeView(view) {
    window.scrollTo(0, 0)
    this.setState({ view, previousView: this.state.view })
  }

  finishedWithAuth(user) {
    this.onUserLoad(user)
    if (user) {
      this.showTaskList()
    }
    this.appMenu.setIsAuthenticated(typeof user === 'object')
  }

  render() {
    return (
      <div>
        <TabbedNav
          manageFilters={() => this.manageFilters()}
          user={this.state.user}
          showAuth={() => this.showAuth()}
          showTasks={() => this.showTaskList()}
          active={this.state.view}
          isAuthenticated={GitHubAuth.isAuthenticated()}
        />
        {this.getViewContents()}
      </div>)
  }
}

App.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
}

const mapStateToProps = state => ({
  filters: state.filters,
  activeFilter: state.filters.find(filter => filter.selected),
})
module.exports = connect(mapStateToProps)(App)
