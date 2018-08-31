'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import update from 'react-addons-update';
import {make, child, raw, props} from '../../shared/react-writer';

import GoogleMap from 'google-map-react';
import {markdown} from 'markdown';

import {
  ARIS_URL,
  SIFTR_URL,
  Game,
  Colors,
  Theme,
  User,
  arisHTTPS,
  Tag,
  Comment,
  Note,
  Field,
  FieldOption,
  FieldData,
  Aris,
} from '../../shared/aris';

function renderMarkdown(str) {
  return {
    __html: markdown.toHTML(str != null ? str : '')
  };
}

function singleObj(k, v) {
  var obj = {};
  obj[k] = v;
  return obj;
}

function countContributors(notes) {
  var comment, l, len, len1, m, note, ref1, user_ids;
  user_ids = {};
  for (l = 0, len = notes.length; l < len; l++) {
    note = notes[l];
    user_ids[note.user.user_id] = true;
    ref1 = note.comments;
    for (m = 0, len1 = ref1.length; m < len1; m++) {
      comment = ref1[m];
      user_ids[comment.user.user_id] = true;
    }
  }
  return Object.keys(user_ids).length;
}

function onSuccess(fn) {
  return function({data, returnCode, returnCodeDescription}) {
    if (returnCode === 0) {
      return fn(data);
    } else {
      alert(`An error occurred: ${returnCodeDescription}`);
    }
  };
}

function reactBind(fn, obj) {
  // TODO: when we upgrade to newer React, change this to fn.bind(obj)
  return fn;
}

function hasNameDesc(game) {
  return (game.name != null) &&
    game.name.match(/\S/) &&
    (game.description != null) &&
    game.description.match(/\S/);
}

const App = React.createClass({
  displayName: 'App',
  getInitialState: function() {
    return {
      auth: null,
      games: [],
      tags: {},
      notes: {},
      forms: {},
      colors: {},
      themes: {},
      username: '',
      password: '',
      screen: 'main',
      edit_game: null,
      new_game: (() => {
        var g;
        g = new Game;
        g.colors_id = 1;
        g.theme_id = 1;
        g.map_show_labels = true;
        g.map_show_roads = true;
        g.map_type = 'STREET';
        g.latitude = 43.087806;
        g.longitude = -89.430121;
        g.zoom = 12;
        g.is_siftr = true;
        return g;
      })(),
      new_categories: [
        {
          category: '',
          color: undefined
        }
      ],
      new_step: null,
      new_icon: null,
      account_menu: false,
      modal_game: null
    };
  },
  componentDidMount: function() {
    this.login(undefined, undefined);
    this.applyHash();
    window.addEventListener('hashchange', () => {
      return this.applyHash();
    });
    return this.getColorsAndThemes();
  },
  applyHash: function() {
    var game, game_id, hash, matchingGames, md;
    this.setState({
      account_menu: false
    });
    hash = window.location.hash.slice(1);
    if ((md = hash.match(/^edit(.*)/)) != null) {
      game_id = parseInt(md[1]);
      matchingGames = (function() {
        var l, len, ref1, results;
        ref1 = this.state.games;
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          game = ref1[l];
          if (game.game_id === game_id) {
            results.push(game);
          }
        }
        return results;
      }).call(this);
      if (matchingGames.length === 1) {
        this.setState({
          screen: 'edit',
          mobile_map_is_open: false,
          edit_game: matchingGames[0]
        });
      } else {
        this.setState({
          screen: 'main'
        });
        // This is temporary if the user is currently being logged in,
        // because the list of games will load and re-call applyHash
      }
    } else if ((md = hash.match(/^form(.*)/)) != null) {
      game_id = parseInt(md[1]);
      matchingGames = (function() {
        var l, len, ref1, results;
        ref1 = this.state.games;
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          game = ref1[l];
          if (game.game_id === game_id) {
            results.push(game);
          }
        }
        return results;
      }).call(this);
      if (matchingGames.length === 1) {
        this.setState({
          screen: 'form',
          edit_game: matchingGames[0]
        });
      } else {
        this.setState({
          screen: 'main'
        });
        // This is temporary if the user is currently being logged in,
        // because the list of games will load and re-call applyHash
      }
    } else if ((md = hash.match(/^map(.*)/)) != null) {
      game_id = parseInt(md[1]);
      matchingGames = (function() {
        var l, len, ref1, results;
        ref1 = this.state.games;
        results = [];
        for (l = 0, len = ref1.length; l < len; l++) {
          game = ref1[l];
          if (game.game_id === game_id) {
            results.push(game);
          }
        }
        return results;
      }).call(this);
      if (matchingGames.length === 1) {
        this.setState({
          screen: 'map',
          edit_game: matchingGames[0]
        });
      } else {
        this.setState({
          screen: 'main'
        });
        // This is temporary if the user is currently being logged in,
        // because the list of games will load and re-call applyHash
      }
    } else if (hash === 'new1') {
      this.setState({
        screen: 'new1',
        new_step: 1
      });
    } else if (hash === 'new3') {
      this.setState({
        screen: 'new3',
        new_step: 3
      });
    } else if (hash === 'new4') {
      this.setState({
        screen: 'new4',
        new_step: 4
      });
    } else if (hash === 'new5') {
      this.setState({
        screen: 'new5',
        new_step: 5
      });
    } else if (hash === 'profile') {
      this.setState({
        screen: 'profile'
      });
    } else if (hash === 'account') {
      this.setState({
        screen: 'account'
      });
    } else if (hash === 'forgot') {
      this.setState({
        screen: 'forgot'
      });
    } else if (hash === 'signup') {
      this.setState({
        screen: 'signup',
        password: '',
        password2: '',
        email: ''
      });
    } else {
      this.setState({
        screen: 'main'
      });
    }
  },
  login: function(username, password) {
    return this.props.aris.login(username, password, () => {
      this.updateLogin();
      if (((username != null) || (password != null)) && (this.props.aris.auth == null)) {
        alert('Incorrect username or password.');
      }
    });
  },
  logout: function() {
    window.location.hash = '#';
    this.props.aris.logout();
    return this.updateLogin();
  },
  updateLogin: function() {
    this.setState({
      auth: this.props.aris.auth,
      account_menu: false,
      password: '',
      password2: ''
    });
    if (this.props.aris.auth && window.location.pathname.match(/\blogin\b/)) {
      return window.location.href = '../discover/';
    } else {
      this.updateGames();
      return this.fetchUserPicture();
    }
  },
  getColorsAndThemes: function() {
    var i, l, m, results;
    for (i = l = 1; l <= 6; i = ++l) { // predefined schemes for now
      ((i) => {
        return this.props.aris.getColors({
          colors_id: i
        }, (result) => {
          if (result.returnCode === 0 && (result.data != null)) {
            this.setState((previousState, currentProps) => {
              return update(previousState, {
                colors: {
                  $merge: singleObj(i, result.data)
                }
              });
            });
          }
        });
      })(i);
    }
    results = [];
    for (i = m = 1; m <= 4; i = ++m) { // predefined schemes for now
      results.push(((i) => {
        return this.props.aris.getTheme({
          theme_id: i
        }, (result) => {
          if (result.returnCode === 0 && (result.data != null)) {
            this.setState((previousState, currentProps) => {
              return update(previousState, {
                themes: {
                  $merge: singleObj(i, result.data)
                }
              });
            });
          }
        });
      })(i));
    }
    return results;
  },
  fetchUserPicture: function() {
    if (this.props.aris.auth != null) {
      this.props.aris.call('media.getMedia', {
        media_id: this.props.aris.auth.media_id
      }, (result) => {
        if (result.returnCode === 0 && (result.data != null)) {
          this.setState({
            userPicture: result.data
          });
        }
      });
    } else {
      this.setState({
        userPicture: null
      });
    }
  },
  updateGames: function() {
    if (this.props.aris.auth != null) {
      return this.props.aris.getGamesForUser({}, (result) => {
        var game, games;
        if (result.returnCode === 0 && (result.data != null)) {
          games = (function() {
            var l, len, ref1, results;
            ref1 = result.data;
            results = [];
            for (l = 0, len = ref1.length; l < len; l++) {
              game = ref1[l];
              if (game.is_siftr) {
                results.push(game);
              }
            }
            return results;
          })();
          this.setState({
            games: games,
            tags: {},
            forms: {},
            notes: {}
          });
          this.applyHash();
          this.updateTags(games);
          this.updateForms(games);
          return this.updateNotes(games);
        } else {
          this.setState({
            games: []
          });
        }
      });
    } else {
      this.setState({
        games: []
      });
    }
  },
  updateNotes: function(games) {
    return games.forEach((game) => {
      return this.props.aris.searchNotes({
        game_id: game.game_id
      }, (result) => {
        if (result.returnCode === 0 && (result.data != null)) {
          this.setState((previousState, currentProps) => {
            return update(previousState, {
              notes: {
                $merge: singleObj(game.game_id, result.data)
              }
            });
          });
        }
      });
    });
  },
  updateForms: function(games, cb = (function() {})) {
    return games.forEach((game) => {
      return this.props.aris.getFieldsForGame({
        game_id: game.game_id
      }, (result) => {
        if (result.returnCode === 0 && (result.data != null)) {
          this.setState((previousState, currentProps) => {
            return update(previousState, {
              forms: {
                $merge: singleObj(game.game_id, result.data)
              }
            });
          }, cb);
        }
      });
    });
  },
  updateTags: function(games, cb = (function() {})) {
    return games.forEach((game) => {
      return this.props.aris.getTagsForGame({
        game_id: game.game_id
      }, (result) => {
        if (result.returnCode === 0 && (result.data != null)) {
          this.setState((previousState, currentProps) => {
            return update(previousState, {
              tags: {
                $merge: singleObj(game.game_id, result.data)
              }
            });
          }, cb);
        }
      });
    });
  },
  // Adds the game to the known games list,
  // or updates an existing game if it shares the game ID.
  updateStateGame: function(newGame) {
    this.setState((previousState, currentProps) => {
      return update(previousState, {
        games: {
          $apply: (games) => {
            var foundOld, game, updated;
            foundOld = false;
            updated = (function() {
              var l, len, results;
              results = [];
              for (l = 0, len = games.length; l < len; l++) {
                game = games[l];
                if (game.game_id === newGame.game_id) {
                  foundOld = true;
                  results.push(newGame);
                } else {
                  results.push(game);
                }
              }
              return results;
            })();
            if (foundOld) {
              return updated;
            } else {
              return updated.concat([newGame]);
            }
          }
        }
      });
    });
  },
  handleSave: function() {
    return this.props.aris.updateGame(this.state.edit_game, (result) => {
      window.location.hash = '#';
      if (result.returnCode === 0 && (result.data != null)) {
        return this.updateStateGame(result.data);
      }
    });
  },
  createNewIcon: function(dataURL, game, cb) {
    var base64, ext, extmap;
    if (dataURL == null) {
      cb(null);
      return;
    }
    extmap = {
      jpg: 'data:image/jpeg;base64,',
      png: 'data:image/png;base64,',
      gif: 'data:image/gif;base64,'
    };
    ext = null;
    base64 = null;
    for (var k in extmap) {
      var v = extmap[k];
      if (dataURL.slice(0, +(v.length - 1) + 1 || 9e9) === v) {
        ext = k;
        base64 = dataURL.slice(v.length);
      }
    }
    if ((ext != null) && (base64 != null)) {
      this.props.aris.call('media.createMedia', {
        game_id: game != null ? game.game_id : undefined,
        file_name: `upload.${ext}`,
        data: base64
      }, cb);
    } else {
      return cb(null);
    }
  },
  createGame: function() {
    return this.props.aris.createGame(this.state.new_game, (result) => {
      var cat, i, l, len, newGame, t, tag, tagObject, tags, tagsRemaining;
      if (result.returnCode === 0 && (result.data != null)) {
        window.location.hash = '#';
        newGame = result.data;
        tags = (function() {
          var l, len, ref1, results;
          ref1 = this.state.new_categories;
          results = [];
          for (l = 0, len = ref1.length; l < len; l++) {
            cat = ref1[l];
            t = cat.category.trim();
            if (!(t.length > 0)) {
              continue;
            }
            results.push({
              category: t,
              color: cat.color
            });
          }
          return results;
        }).call(this);
        if (tags.length === 0) {
          tags = [
            {
              category: 'Observation',
              color: undefined
            }
          ];
        }
        tagsRemaining = tags.length;
        this.createNewIcon(this.state.new_icon, newGame, (result) => {
          if (result != null) {
            this.props.aris.call('games.updateGame', {
              game_id: newGame.game_id,
              icon_media_id: result.data.media_id
            }, ({
                data: game
              }) => {
              return this.updateStateGame(new Game(game));
            });
          }
        });
        for (i = l = 0, len = tags.length; l < len; i = ++l) {
          tag = tags[i];
          tagObject = new Tag;
          tagObject.tag = tag.category;
          tagObject.color = tag.color;
          tagObject.game_id = newGame.game_id;
          this.props.aris.createTag(tagObject, (result) => {
            if (result.returnCode === 0 && (result.data != null)) {
              tagsRemaining--;
              if (tagsRemaining === 0) {
                return this.updateTags([newGame]);
              }
            }
          });
        }
        this.updateStateGame(newGame);
        this.updateForms([newGame]);
        this.setState((previousState, currentProps) => {
          return update(previousState, {
            notes: {
              $merge: singleObj(newGame.game_id, [])
            },
            new_game: {
              $set: (() => {
                var g;
                g = new Game;
                g.colors_id = 1;
                g.theme_id = 1;
                g.map_show_labels = true;
                g.map_show_roads = true;
                g.map_type = 'STREET';
                g.latitude = 43.087806;
                g.longitude = -89.430121;
                g.zoom = 12;
                g.is_siftr = true;
                return g;
              })()
            },
            new_categories: {
              $set: [
                {
                  category: '',
                  color: undefined
                }
              ]
            },
            new_step: {
              $set: null
            },
            new_icon: {
              $set: null
            },
            modal_game: {
              $set: newGame
            }
          });
        });
      }
    });
  },
  sendPasswordReset: function() {
    this.props.aris.call('users.requestForgotPasswordEmail', {
      user_name: this.state.username,
      email: this.state.email
    }, ({returnCode}) => {
      if (returnCode === 0) {
        alert('An email has been sent to that account (if it exists) to reset your password.');
        window.location.replace('#');
      }
    });
  },
  signup: function() {
    if (!this.state.email) {
      alert('Please enter your email address.');
    } else if (this.state.email.indexOf('@') < 0) {
      alert('Your email address is not valid.');
    } else if (!this.state.username) {
      alert('Please select a username.');
    } else if (!(this.state.password || this.state.password2)) {
      alert('Please enter a password.');
    } else if (this.state.password !== this.state.password2) {
      alert('Your passwords do not match.');
    } else {
      this.props.aris.call('users.createUser', {
        user_name: this.state.username,
        password: this.state.password,
        email: this.state.email
      }, ({returnCode, returnCodeDescription}) => {
        if (returnCode !== 0) {
          alert(`Couldn't create account: ${returnCodeDescription}`);
        } else {
          window.location.replace('#');
          this.login(this.state.username, this.state.password);
        }
      });
    }
  },
  continueAutosave: function() {
    var game;
    if ((game = this.autosavePending) != null) {
      this.autosavePending = null;
      this.props.aris.updateGame(game, onSuccess(() => {
        this.continueAutosave();
      }));
    } else {
      this.updateGames();
      this.setState({
        autosaving: false
      });
    }
  },
  autosave: function(game, autosave = true) {
    this.setState({
      edit_game: game
    });
    if (autosave) {
      this.autosavePending = game;
      if (!this.state.autosaving) {
        this.setState({
          autosaving: true
        });
        return this.continueAutosave();
      }
    }
  },
  render: function() {
    var navBarActions;
    navBarActions = () => {
      child('div', () => {
        var ref1, ref2, ref3;
        if ((ref1 = this.state.screen) === 'new1' || ref1 === 'new3' || ref1 === 'new4' || ref1 === 'new5') {
          child('a.create-cancel', {
            href: '#'
          }, () => {
            raw('Cancel');
          });
        } else if ((ref2 = this.state.screen) === 'edit' || ref2 === 'map') {
          if (this.state.autosaving) {
            child('span.create-spinner', () => {
              child('span', () => {
                raw('saving');
              });
              child('img.spinny-saver', {
                src: '../assets/icons/spinny-saver.png'
              });
            });
          }
          child('a.create-cancel', {
            href: '#'
          }, () => {
            raw('Done');
          });
        } else if ((ref3 = this.state.screen) === 'categories' || ref3 === 'form') {
          child('a.create-cancel', {
            href: '#'
          }, () => {
            raw('Done');
          });
        }
      });
    };
    return make(`div.topDiv.accountMenu${(this.state.account_menu ? 'Open' : 'Closed')}`, () => {
      var game;
      child('div.nav-bar.desktop-nav-bar', () => {
        var ref1, ref2;
        child('div.nav-bar-line', () => {
          child('div', () => {
            var ref1;
            child('a', {
              href: '..'
            }, () => {
              child('img#the-logo', {
                src: '../assets/logos/siftr-logo-black.png'
              });
            });
            if ((ref1 = this.state.screen) === 'new1' || ref1 === 'new3' || ref1 === 'new4' || ref1 === 'new5') {
              child('h1.new-siftr-title', () => {
                if (this.state.new_game.name) {
                  raw(this.state.new_game.name);
                } else {
                  raw('New Siftr');
                }
              });
            }
            return child('a', {
              href: '../discover'
            }, () => {
              child('div.nav-button-right', () => {
                raw('Discover');
              });
            });
          });
          return child('div', () => {
            if (this.state.auth != null) {
              return child('a.nav-user', {
                href: '#profile'
              }, () => {
                var ref1;
                child('span', () => {
                  raw(this.state.auth.display_name);
                });
                return child('img', {
                  src: (ref1 = this.state.userPicture) != null ? ref1.thumb_url : undefined
                });
              });
            }
          });
        });
        if ((ref1 = this.state.screen) === 'new1' || ref1 === 'new3' || ref1 === 'new4' || ref1 === 'new5') {
          return child('div.nav-bar-line', () => {
            child('div', () => {
              var requireNameDesc, selectTab;
              selectTab = (step) => {
                if (this.state.screen === step) {
                  return '.create-step-tab-selected';
                } else {
                  return '';
                }
              };
              requireNameDesc = this.state.screen === 'new1' ? (e) => {
                if (!hasNameDesc(this.state.new_game)) {
                  alert('Please enter a name and user instructions for your Siftr.');
                  return e.preventDefault();
                }
              } : undefined;
              child(`a.create-step-tab${selectTab('new1')}`, {
                href: '#new1'
              }, () => {
                raw('Overview');
              });
              child(`a.create-step-tab${selectTab('new3')}`, {
                href: '#new3'
              }, () => {
                props({
                  onClick: requireNameDesc
                });
                raw('Map options');
              });
              child(`a.create-step-tab${selectTab('new4')}`, {
                href: '#new4'
              }, () => {
                props({
                  onClick: requireNameDesc
                });
                raw('Data collection');
              });
              return child(`a.create-step-tab${selectTab('new5')}`, {
                href: '#new5'
              }, () => {
                props({
                  onClick: requireNameDesc
                });
                raw('Share');
              });
            });
            return navBarActions();
          });
        } else if ((ref2 = this.state.screen) === 'edit' || ref2 === 'map' || ref2 === 'form') {
          return child('div.nav-bar-line', () => {
            child('div', () => {
              var selectTab;
              selectTab = (step) => {
                if (this.state.screen === step) {
                  return '.create-step-tab-selected';
                } else {
                  return '';
                }
              };
              child(`a.create-step-tab${selectTab('edit')}`, {
                href: '#edit' + this.state.edit_game.game_id
              }, () => {
                raw('Settings');
              });
              child(`a.create-step-tab${selectTab('map')}`, {
                href: '#map' + this.state.edit_game.game_id
              }, () => {
                raw('Map options');
              });
              return child(`a.create-step-tab${selectTab('form')}`, {
                href: '#form' + this.state.edit_game.game_id
              }, () => {
                raw('Data collection');
              });
            });
            return navBarActions();
          });
        }
      });
      child('div.nav-bar.mobile-nav-bar', () => {
        return child('div.nav-bar-line', () => {
          child('div', () => {
            return child('a', {
              href: '#'
            }, () => {
              props({
                onClick: (e) => {
                  e.preventDefault();
                  this.setState({
                    account_menu: !this.state.account_menu
                  });
                }
              });
              return child('div#the-mobile-menu-button', () => {
                raw('☰');
              });
            });
          });
          return navBarActions();
        });
      });
      child('div#the-content', () => {
        var fields, innerNav;
        if (this.state.auth != null) {
          innerNav = () => {
            return child(InnerNav, {
              screen: this.state.screen,
              userPicture: this.state.userPicture,
              auth: this.state.auth,
              logout: this.logout
            });
          };
          switch (this.state.screen) {
            case 'profile':
              innerNav();
              return child(ProfileSettings, {
                aris: this.props.aris,
                auth: this.state.auth,
                userPicture: this.state.userPicture,
                onSave: (obj) => {
                  var useMediaID;
                  useMediaID = (media_id) => {
                    this.props.aris.call('users.updateUser', {
                      user_id: this.props.aris.auth.user_id,
                      display_name: obj.display_name,
                      bio: obj.bio,
                      url: obj.url,
                      media_id: media_id
                    }, ({returnCode, returnCodeDescription}) => {
                      if (returnCode === 0) {
                        this.login(undefined, undefined);
                        window.location.replace('#');
                      } else {
                        alert(`Couldn't save your account details: ${returnCodeDescription}`);
                      }
                    });
                  };
                  if (obj.new_icon != null) {
                    return this.createNewIcon(obj.new_icon, null, (result) => {
                      if (result != null) {
                        useMediaID(result.data.media_id);
                      } else {
                        alert("Your user picture is not of a supported type.");
                      }
                    });
                  } else {
                    useMediaID(null);
                  }
                }
              });
            case 'account':
              innerNav();
              return child(AccountSettings, {
                aris: this.props.aris,
                auth: this.state.auth,
                onSave: (obj) => {
                  this.props.aris.call('users.updateUser', {
                    user_id: this.props.aris.auth.user_id,
                    email: obj.email
                  }, ({returnCode, returnCodeDescription}) => {
                    if (returnCode === 0) {
                      if (obj.new_password) {
                        this.props.aris.call('users.changePassword', {
                          user_name: obj.user_name,
                          old_password: obj.old_password,
                          new_password: obj.new_password
                        }, ({returnCode, returnCodeDescription}) => {
                          if (returnCode === 0) {
                            this.logout();
                            this.login(obj.user_name, obj.new_password);
                          } else {
                            alert(`Couldn't change your password: ${returnCodeDescription}`);
                          }
                        });
                      } else {
                        this.login(undefined, undefined);
                        window.location.replace('#');
                      }
                    } else {
                      alert(`Couldn't save your account details: ${returnCodeDescription}`);
                    }
                  });
                }
              });
            case 'edit':
              return child(EditOverview, {
                game: this.state.edit_game,
                onChange: reactBind(this.autosave, this),
                mobileMapIsOpen: this.state.mobile_map_is_open,
                openMobileMap: () => {
                  this.setState({
                    mobile_map_is_open: true
                  });
                  return setTimeout(() => {
                    return window.dispatchEvent(new Event('resize'));
                  }, 250);
                },
                closeMobileMap: () => {
                  this.setState({
                    mobile_map_is_open: false
                  });
                }
              });
            case 'form':
              fields = this.state.forms[this.state.edit_game.game_id];
              return child(FormEditor, {
                editing: true,
                game: this.state.edit_game,
                fields: fields,
                categories: this.state.tags[this.state.edit_game.game_id],
                colors: this.state.colors,
                setPrompt: (prompt) => {
                  var game;
                  game = update(this.state.edit_game, {
                    prompt: {
                      $set: prompt
                    }
                  });
                  this.props.aris.updateGame(game, onSuccess((game) => {
                    this.updateGames(); // TODO just use the game from the result
                  }));
                },
                addField: (field_type) => {
                  this.props.aris.call('fields.createField', {
                    game_id: this.state.edit_game.game_id,
                    field_type: field_type,
                    required: false,
                    sort_index: fields.length
                  }, onSuccess(() => {
                    this.updateForms([this.state.edit_game]);
                  }));
                },
                updateField: (field) => {
                  this.props.aris.call('fields.updateField', field, onSuccess(() => {
                    this.updateForms([this.state.edit_game]);
                  }));
                },
                deleteField: (field) => {
                  this.props.aris.call('fields.deleteField', {
                    game_id: this.state.edit_game.game_id,
                    field_id: field.field_id
                  }, onSuccess(() => {
                    this.updateForms([this.state.edit_game]);
                  }));
                },
                reorderFields: (indexes, cb) => {
                  var field, i, l, len, n, results;
                  n = fields.length;
                  results = [];
                  for (i = l = 0, len = fields.length; l < len; i = ++l) {
                    field = fields[i];
                    results.push(this.props.aris.call('fields.updateField', {
                      game_id: field.game_id,
                      field_id: field.field_id,
                      sort_index: indexes.indexOf(i)
                    }, onSuccess(() => {
                      n -= 1;
                      if (n === 0) {
                        this.updateForms([this.state.edit_game], cb);
                      }
                    })));
                  }
                  return results;
                },
                addFieldOption: ({field, option}, cb) => {
                  this.props.aris.call('fields.createFieldOption', {
                    game_id: this.state.edit_game.game_id,
                    field_id: field.field_id,
                    option: option
                  }, onSuccess(() => {
                    this.updateForms([this.state.edit_game], cb);
                  }));
                },
                updateFieldOption: ({field_option, option}, cb) => {
                  this.props.aris.call('fields.updateFieldOption', {
                    game_id: this.state.edit_game.game_id,
                    field_id: field_option.field_id,
                    field_option_id: field_option.field_option_id,
                    option: option
                  }, onSuccess(() => {
                    this.updateForms([this.state.edit_game], cb);
                  }));
                },
                deleteFieldOption: ({field_option, new_field_option}, cb) => {
                  this.props.aris.call('fields.deleteFieldOption', {
                    game_id: this.state.edit_game.game_id,
                    field_id: field_option.field_id,
                    field_option_id: field_option.field_option_id,
                    new_field_option_id: new_field_option != null ? new_field_option.field_option_id : undefined
                  }, onSuccess(() => {
                    this.updateForms([this.state.edit_game], cb);
                  }));
                },
                reorderFieldOptions: (field, indexes, cb) => {
                  var i, l, len, n, option, ref1, results;
                  n = field.options.length;
                  ref1 = field.options;
                  results = [];
                  for (i = l = 0, len = ref1.length; l < len; i = ++l) {
                    option = ref1[i];
                    results.push(this.props.aris.call('fields.updateFieldOption', {
                      game_id: field.game_id,
                      field_id: field.field_id,
                      field_option_id: option.field_option_id,
                      sort_index: indexes.indexOf(i)
                    }, onSuccess(() => {
                      n -= 1;
                      if (n === 0) {
                        this.updateForms([this.state.edit_game], cb);
                      }
                    })));
                  }
                  return results;
                },
                addCategory: ({name}, cb) => {
                  var tagObject;
                  tagObject = new Tag;
                  tagObject.tag = name;
                  tagObject.game_id = this.state.edit_game.game_id;
                  tagObject.sort_index = this.state.tags[this.state.edit_game.game_id].length;
                  this.props.aris.createTag(tagObject, () => {
                    this.updateTags([this.state.edit_game], cb);
                  });
                },
                updateCategory: ({tag_id, name, color}, cb) => {
                  this.props.aris.updateTag({
                    game_id: this.state.edit_game.game_id,
                    tag_id: tag_id,
                    tag: name,
                    color: color
                  }, () => {
                    this.updateTags([this.state.edit_game], cb);
                  });
                },
                deleteCategory: ({tag_id, new_tag_id}, cb) => {
                  this.props.aris.call('tags.deleteTag', {
                    tag_id: tag_id,
                    new_tag_id: new_tag_id
                  }, () => {
                    this.updateTags([this.state.edit_game], cb);
                  });
                },
                reorderCategories: (indexes, cb) => {
                  var i, l, len, n, results, tag, tags;
                  tags = this.state.tags[this.state.edit_game.game_id];
                  n = tags.length;
                  results = [];
                  for (i = l = 0, len = tags.length; l < len; i = ++l) {
                    tag = tags[i];
                    tag = update(tag, {
                      sort_index: {
                        $set: indexes.indexOf(i)
                      }
                    });
                    results.push(this.props.aris.updateTag(tag, onSuccess(() => {
                      n -= 1;
                      if (n === 0) {
                        this.updateTags([this.state.edit_game], cb);
                      }
                    })));
                  }
                  return results;
                }
              });
            case 'map':
              return child(MapOptions, {
                editing: true,
                game: this.state.edit_game,
                colors: this.state.colors,
                themes: this.state.themes,
                onChange: reactBind(this.autosave, this)
              });
            case 'new1':
              return child(NewOverview, {
                game: this.state.new_game,
                icon: this.state.new_icon,
                onChange: (new_game) => {
                  this.setState({new_game});
                },
                onIconChange: (new_icon) => {
                  this.setState({new_icon});
                }
              });
            case 'new3':
              return child(MapOptions, {
                game: this.state.new_game,
                colors: this.state.colors,
                themes: this.state.themes,
                onChange: (new_game) => {
                  this.setState({new_game});
                }
              });
            case 'new4':
              return child(FormEditor, {
                editing: false,
                game: this.state.new_game,
                categories: this.state.new_categories,
                colors: this.state.colors,
                onChange: (new_game) => {
                  this.setState({new_game});
                },
                onChangeCategories: (new_categories) => {
                  this.setState({new_categories});
                }
              });
            case 'new5':
              return child(ShareOptions, {
                game: this.state.new_game,
                onChange: (new_game) => {
                  this.setState({new_game});
                },
                onCreate: this.createGame
              });
            default:
              return child('div', () => {
                innerNav();
                child(SiftrList, {
                  updateStateGame: this.updateStateGame,
                  aris: this.props.aris,
                  games: this.state.games,
                  colors: this.state.colors,
                  notes: this.state.notes,
                  tags: this.state.tags,
                  onDelete: (game) => {
                    this.props.aris.call('games.deleteGame', {
                      game_id: game.game_id
                    }, ({returnCode, returnCodeDescription}) => {
                      if (returnCode === 0) {
                        this.updateGames();
                      } else {
                        alert(`There was an error deleting your Siftr: ${returnCodeDescription}`);
                      }
                    });
                  }
                });
                return child('p.new-siftr-para', () => {
                  return child('a.new-siftr-button.login-button', {
                    href: '#new1'
                  }, () => {
                    raw('NEW SIFTR');
                  });
                });
              });
          }
        } else {
          switch (this.state.screen) {
            case 'forgot':
              return child('div.loginForm', () => {
                child('p', () => {
                  raw('Enter your username ');
                  child('b', () => {
                    raw('or');
                  });
                  raw(' email to reset your password.');
                });
                child('p', () => {
                  var ref1;
                  return child('input.full-width-input', {
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                    type: 'text',
                    placeholder: 'Username',
                    value: (ref1 = this.state.username) != null ? ref1 : '',
                    onChange: (e) => {
                      this.setState({
                        username: e.target.value
                      });
                    },
                    onKeyDown: (e) => {
                      if (e.keyCode === 13) {
                        this.sendPasswordReset();
                      }
                    }
                  });
                });
                child('p', () => {
                  var ref1;
                  return child('input.full-width-input', {
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                    type: 'text',
                    placeholder: 'Email',
                    value: (ref1 = this.state.email) != null ? ref1 : '',
                    onChange: (e) => {
                      this.setState({
                        email: e.target.value
                      });
                    },
                    onKeyDown: (e) => {
                      if (e.keyCode === 13) {
                        return this.sendPasswordReset();
                      }
                    }
                  });
                });
                child('a', {
                  href: '#'
                }, () => {
                  props({
                    onClick: (e) => {
                      e.preventDefault();
                      return this.sendPasswordReset();
                    }
                  });
                  return child('div.login-button', () => {
                    raw('SEND EMAIL');
                  });
                });
                return child('a', {
                  href: '#'
                }, () => {
                  return child('div.login-button', () => {
                    raw('BACK');
                  });
                });
              });
            case 'signup':
              return child('div.loginForm', () => {
                child('p', () => {
                  raw('Create a new Siftr account');
                });
                child('p', () => {
                  var ref1;
                  return child('input.full-width-input', {
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                    type: 'text',
                    placeholder: 'Email',
                    value: (ref1 = this.state.email) != null ? ref1 : '',
                    onChange: (e) => {
                      this.setState({
                        email: e.target.value
                      });
                    },
                    onKeyDown: (e) => {
                      if (e.keyCode === 13) {
                        return this.signup();
                      }
                    }
                  });
                });
                child('p', () => {
                  var ref1;
                  return child('input.full-width-input', {
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                    type: 'text',
                    placeholder: 'Username',
                    value: (ref1 = this.state.username) != null ? ref1 : '',
                    onChange: (e) => {
                      this.setState({
                        username: e.target.value
                      });
                    },
                    onKeyDown: (e) => {
                      if (e.keyCode === 13) {
                        return this.signup();
                      }
                    }
                  });
                });
                child('p', () => {
                  var ref1;
                  return child('input.full-width-input', {
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                    type: 'password',
                    placeholder: 'Password',
                    value: (ref1 = this.state.password) != null ? ref1 : '',
                    onChange: (e) => {
                      this.setState({
                        password: e.target.value
                      });
                    },
                    onKeyDown: (e) => {
                      if (e.keyCode === 13) {
                        return this.signup();
                      }
                    }
                  });
                });
                child('p', () => {
                  var ref1;
                  return child('input.full-width-input', {
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                    type: 'password',
                    placeholder: 'Repeat password',
                    value: (ref1 = this.state.password2) != null ? ref1 : '',
                    onChange: (e) => {
                      this.setState({
                        password2: e.target.value
                      });
                    },
                    onKeyDown: (e) => {
                      if (e.keyCode === 13) {
                        return this.signup();
                      }
                    }
                  });
                });
                child('a', {
                  href: '#'
                }, () => {
                  props({
                    onClick: (e) => {
                      e.preventDefault();
                      return this.signup();
                    }
                  });
                  return child('div.login-button', () => {
                    raw('CREATE ACCOUNT');
                  });
                });
                return child('a', {
                  href: '#'
                }, () => {
                  return child('div.login-button', () => {
                    raw('BACK');
                  });
                });
              });
            default:
              return child('div.loginForm', () => {
                child('p', () => {
                  raw('Login with a Siftr or ARIS account');
                });
                child('p', () => {
                  var ref1;
                  return child('input.full-width-input', {
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                    type: 'text',
                    placeholder: 'Username',
                    value: (ref1 = this.state.username) != null ? ref1 : '',
                    onChange: (e) => {
                      this.setState({
                        username: e.target.value
                      });
                    },
                    onKeyDown: (e) => {
                      if (e.keyCode === 13) {
                        return this.login(this.state.username, this.state.password);
                      }
                    }
                  });
                });
                child('p', () => {
                  var ref1;
                  return child('input.full-width-input', {
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                    type: 'password',
                    placeholder: 'Password',
                    value: (ref1 = this.state.password) != null ? ref1 : '',
                    onChange: (e) => {
                      this.setState({
                        password: e.target.value
                      });
                    },
                    onKeyDown: (e) => {
                      if (e.keyCode === 13) {
                        return this.login(this.state.username, this.state.password);
                      }
                    }
                  });
                });
                child('a', {
                  href: '#'
                }, () => {
                  props({
                    onClick: (e) => {
                      e.preventDefault();
                      return this.login(this.state.username, this.state.password);
                    }
                  });
                  return child('div.login-button', () => {
                    raw('LOGIN');
                  });
                });
                child('a', {
                  href: '#signup'
                }, () => {
                  return child('div.login-button', () => {
                    raw('CREATE ACCOUNT');
                  });
                });
                return child('a', {
                  href: '#forgot'
                }, () => {
                  return child('div.login-button', () => {
                    raw('FORGOT PASSWORD?');
                  });
                });
              });
          }
        }
      });
      child('div.accountMenuMobile', () => {
        child('a', {
          href: '#'
        }, () => {
          props({
            onClick: (e) => {
              e.preventDefault();
              this.setState({
                account_menu: false
              });
            }
          });
          return child('div', () => {
            return child('img', {
              src: '../assets/icons/x-white.png'
            });
          });
        });
        return child('div.accountMenuMobileContents', () => {
          if (this.state.auth != null) {
            child('a.unlink', {
              href: '#profile'
            }, () => {
              child('p', () => {
                return child('span.account-menu-user-pic', {
                  style: {
                    backgroundImage: this.state.userPicture != null ? `url(${arisHTTPS(this.state.userPicture.thumb_url)})` : undefined
                  }
                });
              });
              return child('p', () => {
                raw(this.state.auth.display_name);
              });
            });
          } else {
            child('p', () => {
              raw('Not logged in');
            });
          }
          child('p', () => {
            return child('a', {
              href: '..'
            }, () => {
              return child('img', {
                src: '../assets/logos/brand-mobile.png'
              });
            });
          });
          child('p', () => {
            return child('a', {
              href: '../editor'
            }, () => {
              raw('My Siftrs');
            });
          });
          child('p', () => {
            return child('a', {
              href: '../discover'
            }, () => {
              raw('Discover');
            });
          });
          if (this.state.auth != null) {
            return child('p', () => {
              return child('a', {
                href: '#'
              }, () => {
                props({
                  onClick: (e) => {
                    e.preventDefault();
                    return this.logout();
                  }
                });
                raw('Logout');
              });
            });
          }
        });
      });
      if (this.state.modal_game != null) {
        game = this.state.modal_game;
        return child('div.newGameFixedBox', () => {
          child('a.newGameCurtain', {
            href: '#',
            onClick: (e) => {
              e.preventDefault();
              this.setState({
                modal_game: null
              });
            }
          });
          return child('div.newGameModal', () => {
            ({
              onClick: (e) => {
                return e.stopPropagation();
              }
            });
            child('h1', () => {
              raw('Awesome! Your Siftr project is now live.');
            });
            child('p', () => {
              raw('You can access it here:');
            });
            child('p', () => {
              return child('a', () => {
                var url;
                url = `${SIFTR_URL}${game.siftr_url || game.game_id}`;
                props({
                  target: '_blank',
                  href: url
                });
                raw(url);
              });
            });
            return child('p', () => {
              raw('Or in the Siftr mobile app, enter ');
              child('span.newGameMobileCode', () => {
                raw(`${game.siftr_url || game.game_id}`);
              });
              raw(' in the search bar.');
            });
          });
        });
      }
    });
  }
});

const AccountSettings = React.createClass({
  displayName: 'AccountSettings',
  getInitialState: function() {
    return {
      email: this.props.auth.email,
      old_password: '',
      password: '',
      password2: ''
    };
  },
  render: function() {
    var ref1;
    const passwordBox = (placeholder, key) => (
      <p>
        <input
          className="full-width-input"
          type="password"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={placeholder}
          value={(ref1 = this.state[key]) != null ? ref1 : ''}
          onChange={(e) => {
            this.setState({[key]: e.target.value});
          }}
        />
      </p>
    );
    return (
      <div className="settings">
        <h4>Email</h4>
        <p>
          <input
            className="full-width-input"
            type="text"
            autoCapitalize="off"
            autoCorrect="off"
            value={(ref1 = this.state.email) != null ? ref1 : ''}
            onChange={(e) => {
              this.setState({email: e.target.value});
            }}
          />
        </p>
        <h3>Change Password</h3>
        {passwordBox('old password', 'old_password')}
        {passwordBox('new password', 'password')}
        {passwordBox('repeat password', 'password2')}
        <p>
          <a href="#" className="settings-save" onClick={(e) => {
            e.preventDefault();
            const save = () => {
              return this.props.onSave({
                email: this.state.email,
                user_name: this.props.aris.auth.username,
                old_password: this.state.old_password,
                new_password: this.state.password
              });
            };
            if (this.state.password === '' && this.state.password2 === '') {
              save();
            } else if (!this.state.old_password) {
              alert('Please enter your current password.');
            } else if (!(this.state.password || this.state.password2)) {
              alert('Please enter a new password.');
            } else if (this.state.password !== this.state.password2) {
              alert('Your two passwords do not match.');
            } else {
              save();
            }
          }}>
            Save
          </a>
        </p>
      </div>
    );
  }
});

const ProfileSettings = React.createClass({
  displayName: 'ProfileSettings',
  getInitialState: function() {
    return {
      display_name: this.props.auth.display_name,
      new_icon: null,
      bio: this.props.auth.bio,
      url: this.props.auth.url
    };
  },
  selectUserPicture: function() {
    var input;
    input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      return this.loadUserPicture(e.target.files[0]);
    };
    return input.click();
  },
  loadUserPicture: function(file) {
    var fr;
    fr = new FileReader;
    fr.onload = () => {
      this.setState({
        new_icon: fr.result
      });
    };
    return fr.readAsDataURL(file);
  },
  render: function() {
    return make('div.settings', () => {
      child('p.para-account-picture', () => {
        child('span.big-account-picture', {
          style: {
            backgroundImage: this.state.new_icon != null ? `url(${this.state.new_icon})` : this.props.userPicture != null ? `url(${this.props.userPicture.url})` : undefined
          },
          onClick: this.selectUserPicture,
          onDragOver: (e) => {
            e.stopPropagation();
            e.preventDefault();
          },
          onDrop: (e) => {
            var file, l, len, ref1;
            e.stopPropagation();
            e.preventDefault();
            ref1 = e.dataTransfer.files;
            for (l = 0, len = ref1.length; l < len; l++) {
              file = ref1[l];
              this.loadUserPicture(file);
              break;
            }
          }
        });
      });
      child('h4', () => {
        raw('Display name');
      });
      child('p', () => {
        var ref1;
        child('input.full-width-input', {
          autoCapitalize: 'off',
          autoCorrect: 'off',
          type: 'text',
          value: (ref1 = this.state.display_name) != null ? ref1 : '',
          onChange: (e) => {
            this.setState({
              display_name: e.target.value
            });
          }
        });
      });
      child('h4', () => {
        raw('Bio');
      });
      child('p', () => {
        var ref1;
        return child('input.full-width-input', {
          type: 'text',
          value: (ref1 = this.state.bio) != null ? ref1 : '',
          onChange: (e) => {
            this.setState({
              bio: e.target.value
            });
          }
        });
      });
      child('h4', () => {
        raw('Website url');
      });
      child('p', () => {
        var ref1;
        child('input.full-width-input', {
          autoCapitalize: 'off',
          autoCorrect: 'off',
          type: 'text',
          value: (ref1 = this.state.url) != null ? ref1 : '',
          onChange: (e) => {
            this.setState({
              url: e.target.value
            });
          }
        });
      });
      child('p', () => {
        child('a.settings-save', {
          href: '#'
        }, () => {
          props({
            onClick: (e) => {
              e.preventDefault();
              return this.props.onSave({
                display_name: this.state.display_name,
                email: this.state.email,
                new_icon: this.state.new_icon,
                bio: this.state.bio,
                url: this.state.url
              });
            }
          });
          raw('Save');
        });
      });
    });
  }
});

const InnerNav = React.createClass({
  displayName: 'InnerNav',
  render: function() {
    return make('div.inner-nav', () => {
      child('div.inner-nav-user', () => {
        child('div.inner-nav-pic', {
          style: {
            backgroundImage: this.props.userPicture != null ? `url(${arisHTTPS(this.props.userPicture.thumb_url)})` : undefined
          }
        });
        return child('div.inner-nav-headers', () => {
          child('h1.inner-nav-name', () => {
            raw(this.props.auth.display_name);
            return child('a.inner-nav-logout', {
              href: '#'
            }, () => {
              props({
                onClick: (e) => {
                  e.preventDefault();
                  return this.props.logout();
                }
              });
              raw('Log Out');
            });
          });
          if (this.props.auth.bio) {
            child('p.inner-nav-bio', () => {
              raw(this.props.auth.bio);
            });
          }
          if (this.props.auth.url) {
            return child('p.inner-nav-url', () => {
              return child('a', {
                href: this.props.auth.url,
                target: '_blank'
              }, () => {
                raw(this.props.auth.url);
              });
            });
          }
        });
      });
      return child('div.inner-nav-bar', () => {
        var className, href, l, label, len, navs, screen;
        navs = [
          {
            href: '#profile',
            label: 'Profile',
            screen: 'profile'
          },
          {
            href: '#account',
            label: 'Account',
            screen: 'account'
          },
          {
            href: '#',
            label: 'My Siftrs',
            screen: 'main'
          }
        ];
        for (l = 0, len = navs.length; l < len; l++) {
          ({href, label, screen} = navs[l]);
          className = screen === this.props.screen ? 'a.inner-nav-bar-item.inner-nav-bar-item-current' : 'a.inner-nav-bar-item';
          child(className, {
            href: href
          }, () => {
            raw(label);
          });
        }
        return child('a.inner-nav-bar-filler');
      });
    });
  }
});

const SiftrIcon = React.createClass({
  displayName: 'SiftrIcon',
  getInitialState: function() {
    return {
      url: null
    };
  },
  fetchIcon: function(props) {
    var media_id;
    media_id = parseInt(props.game.icon_media_id);
    if (!media_id) {
      return;
    }
    if (media_id === this.fetchedMediaID) {
      return;
    }
    this.fetchedMediaID = media_id;
    return props.aris.call('media.getMedia', {
      media_id: media_id
    }, (result) => {
      if (result.returnCode === 0 && (result.data != null)) {
        this.setState({
          url: result.data.thumb_url
        });
      }
    });
  },
  componentDidMount: function() {
    return this.fetchIcon(this.props);
  },
  componentWillReceiveProps: function(nextProps, nextState) {
    return this.fetchIcon(nextProps);
  },
  loadImageFile: function(file) {
    var fr;
    fr = new FileReader;
    fr.onload = () => {
      var base64, dataURL, ext, extmap;
      dataURL = fr.result;
      if (dataURL == null) {
        return;
      }
      extmap = {
        jpg: 'data:image/jpeg;base64,',
        png: 'data:image/png;base64,',
        gif: 'data:image/gif;base64,'
      };
      ext = null;
      base64 = null;
      for (var k in extmap) {
        var v = extmap[k];
        if (dataURL.slice(0, +(v.length - 1) + 1 || 9e9) === v) {
          ext = k;
          base64 = dataURL.slice(v.length);
        }
      }
      if ((ext != null) && (base64 != null)) {
        return this.props.aris.call('media.createMedia', {
          game_id: this.props.game.game_id,
          file_name: `upload.${ext}`,
          data: base64
        }, (result) => {
          if (result != null) {
            return this.props.aris.call('games.updateGame', {
              game_id: this.props.game.game_id,
              icon_media_id: result.data.media_id
            }, ({
                data: game
              }) => {
              return this.props.updateStateGame(new Game(game));
            });
          }
        });
      }
    };
    return fr.readAsDataURL(file);
  },
  render: function() {
    return make('a.siftr-icon', {
      href: '#',
      onClick: (e) => {
        var input;
        e.preventDefault();
        input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
          return this.loadImageFile(e.target.files[0]);
        };
        return input.click();
      },
      style: this.state.url != null ? {
        backgroundImage: `url(${this.state.url})`
      } : {}
    });
  }
});

const SiftrList = React.createClass({
  displayName: 'SiftrList',
  render: function() {
    return make('div.siftrList', () => {
      return this.props.games.forEach((game) => {
        var notes;
        notes = this.props.notes[game.game_id];
        return child('div.siftr-entry', {
          key: `game-${game.game_id}`
        }, () => {
          child(SiftrIcon, {
            game: game,
            aris: this.props.aris,
            updateStateGame: this.props.updateStateGame
          });
          return child('div.siftr-entry-right', () => {
            var colors, i, percent, points, rgb, tag, tags;
            child('div.siftr-entry-title-buttons', () => {
              child('a.siftr-entry-title', {
                href: `${SIFTR_URL}${game.siftr_url || game.game_id}`,
                target: '_blank'
              }, () => {
                raw(game.name);
              });
              return child('span', () => {
                child('a', {
                  href: `\#edit${game.game_id}`
                }, () => {
                  return child('span.siftr-command-button', () => {
                    raw('EDIT');
                  });
                });
                return child('a', {
                  href: '#'
                }, () => {
                  props({
                    onClick: (e) => {
                      e.preventDefault();
                      if (confirm(`Are you sure you want to delete "${game.name}"?`)) {
                        return this.props.onDelete(game);
                      }
                    }
                  });
                  return child('span.siftr-command-button', () => {
                    raw('DELETE');
                  });
                });
              });
            });
            child('div.siftr-color-bar', {
              style: {
                backgroundImage: (function() {
                  var l, len;
                  if (((colors = this.props.colors[game.colors_id]) != null) && ((tags = this.props.tags[game.game_id]) != null)) {
                    percent = 0;
                    points = [];
                    for (i = l = 0, len = tags.length; l < len; i = ++l) {
                      tag = tags[i];
                      rgb = tag.color || colors[`tag_${(i % 8) + 1}`];
                      points.push(`${rgb} ${percent}%`);
                      percent += 100 / tags.length;
                      points.push(`${rgb} ${percent}%`);
                    }
                    return `linear-gradient(to right, ${points.join(', ')})`;
                  } else {
                    return 'linear-gradient(to right, gray, gray)';
                  }
                }).call(this)
              }
            });
            return child('div.siftr-data', () => {
              var plural, sep;
              sep = () => {
                return child('span.siftr-data-pipe', () => {
                  raw('|');
                });
              };
              plural = function(n, noun) {
                if (n === 1) {
                  return `${n} ${noun}`;
                } else {
                  return `${n != null ? n : '...'} ${noun}s`;
                }
              };
              raw(plural(notes != null ? notes.length : undefined, 'item'));
              sep();
              raw(plural((notes != null ? countContributors(notes) : null), 'contributor'));
              sep();
              raw((game.published ? 'Public' : 'Private'));
              sep();
              raw((game.moderated ? 'Moderated' : 'Non-Moderated'));
            });
          });
        });
      });
    });
  }
});

const EditOverview = React.createClass({
  displayName: 'EditOverview',
  render: function() {
    return make('div.newStepBox', () => {
      child('div.newStep1', () => {
        child('div.newStep1LeftColumn', () => {
          return child('form', () => {
            var currentLink, hidden, moderated;
            child('h2', () => {
              raw(this.props.game.name);
            });
            child('label', () => {
              var ref1;
              child('h4', () => {
                raw('NAME');
              });
              return child('input.full-width-input', {
                type: 'text',
                value: (ref1 = this.props.game.name) != null ? ref1 : '',
                onChange: (e) => {
                  var game;
                  game = update(this.props.game, {
                    name: {
                      $set: e.target.value
                    }
                  });
                  return this.props.onChange(game, false);
                },
                onBlur: () => {
                  return this.props.onChange(this.props.game, true);
                }
              });
            });
            child('label', () => {
              var ref1;
              child('h4', () => {
                raw('USER INSTRUCTIONS ');
                return child('a', {
                  href: 'https://daringfireball.net/projects/markdown/syntax',
                  target: '_blank'
                }, () => {
                  return child('i', () => {
                    raw('markdown supported');
                  });
                });
              });
              child('p', () => {
                raw('Tell your users what you want them to do and why.');
              });
              return child('textarea.full-width-textarea', {
                value: (ref1 = this.props.game.description) != null ? ref1 : '',
                onChange: (e) => {
                  var game;
                  game = update(this.props.game, {
                    description: {
                      $set: e.target.value
                    }
                  });
                  return this.props.onChange(game, false);
                },
                onBlur: () => {
                  return this.props.onChange(this.props.game, true);
                }
              });
            });
            child('div', {
              dangerouslySetInnerHTML: renderMarkdown(this.props.game.description)
            });
            child('label', () => {
              child('h4', () => {
                raw('PROJECT LINK');
              });
              return child('p', () => {
                var ref1;
                return child('input.full-width-input', {
                  type: 'text',
                  placeholder: 'Identifier (optional)',
                  value: (ref1 = this.props.game.siftr_url) != null ? ref1 : '',
                  onChange: (e) => {
                    var url;
                    url = e.target.value.replace(/[^A-Za-z0-9_\-]/g, '');
                    return this.props.onChange(update(this.props.game, {
                      siftr_url: {
                        $set: url
                      }
                    }), false);
                  },
                  onBlur: () => {
                    return this.props.onChange(this.props.game, true);
                  }
                });
              });
            });
            currentLink = this.props.game.siftr_url || this.props.game.game_id;
            child('p', () => {
              child('b', () => {
                raw(this.props.game.name);
              });
              raw(" will be located at ");
              return child('code', () => {
                raw(`${SIFTR_URL}${currentLink}`);
              });
            });
            child('p', () => {
              raw('Or in the mobile app, enter ');
              child('code', () => {
                raw(currentLink);
              });
              raw(' in the search bar.');
            });
            child('h2', () => {
              raw('SHARE');
            });
            child('h4', () => {
              raw('PRIVACY');
            });
            hidden = !this.props.game.published;
            child(`a.form-multi-option.form-multi-option-${(hidden ? 'on' : 'off')}`, {
              href: '#'
            }, () => {
              props({
                onClick: (e) => {
                  e.preventDefault();
                  return this.props.onChange(update(this.props.game, {
                    published: {
                      $set: hidden
                    }
                  }));
                }
              });
              child('span.form-multi-option-text', () => {
                raw('Hide from search');
              });
              return child('span.form-multi-option-switch', () => {
                return child('span.form-multi-option-ball');
              });
            });
            // TODO uncomment/translate when native app has password support
            /*
            child 'p', =>
              raw 'Do you want to set a password to restrict access?'
            child 'p', =>
              child 'input.full-width-input',
            type: 'text'
            placeholder: 'Password (optional)'
            value: @props.game.password ? ''
            onChange: (e) => @props.onChange update(@props.game, password: $set: e.target.value), false
            onBlur: => @props.onChange @props.game, true
            */
            moderated = this.props.game.moderated;
            return child(`a.form-multi-option.form-multi-option-${(moderated ? 'on' : 'off')}`, {
              href: '#'
            }, () => {
              props({
                onClick: (e) => {
                  e.preventDefault();
                  return this.props.onChange(update(this.props.game, {
                    moderated: {
                      $set: !moderated
                    }
                  }));
                }
              });
              child('span.form-multi-option-text', () => {
                raw('Require moderation?');
              });
              return child('span.form-multi-option-switch', () => {
                return child('span.form-multi-option-ball');
              });
            });
          });
        });
        return child('div.newStep1RightColumn');
      });
      return child('div.bottom-step-buttons', () => {
        child('div');
        return child('a', {
          href: '#map' + this.props.game.game_id
        }, () => {
          return child('div.newNextButton', () => {
            raw('map >');
          });
        });
      });
    });
  }
});

const NewOverview = React.createClass({
  displayName: 'NewOverview',
  render: function() {
    return make('div.newStepBox', () => {
      child('div.newStep1', () => {
        child('div.newStep1Column.newStep1LeftColumn', () => {
          child('h3', () => {
            raw('What kind of Siftr do you want to make?');
          });
          return child('div', () => {
            child('label', () => {
              var ref1;
              child('p', () => {
                raw('NAME');
              });
              return child('input.full-width-input', {
                ref: 'name',
                type: 'text',
                value: (ref1 = this.props.game.name) != null ? ref1 : '',
                onChange: this.handleChange
              });
            });
            child('label', () => {
              child('p', () => {
                raw('SIFTR ICON');
              });
              return child('a', {
                href: '#'
              }, () => {
                props({
                  onClick: (e) => {
                    e.preventDefault();
                    return this.selectImage();
                  }
                });
                return child(`div.siftr-icon-area.siftr-icon-${(this.props.icon != null ? 'filled' : 'empty')}`, () => {
                  if (this.props.icon != null) {
                    props({
                      style: {
                        backgroundImage: `url(${this.props.icon})`
                      }
                    });
                  } else {
                    child('div.siftr-icon-gray-circle');
                    child('h3', () => {
                      raw('Drag an image here or click to browse.');
                    });
                    child('p', () => {
                      return child('i', () => {
                        raw('200px by 200px recommended');
                      });
                    });
                  }
                  return props({
                    onDragOver: (e) => {
                      e.stopPropagation();
                      return e.preventDefault();
                    },
                    onDrop: (e) => {
                      var file, l, len, ref1;
                      e.stopPropagation();
                      e.preventDefault();
                      ref1 = e.dataTransfer.files;
                      for (l = 0, len = ref1.length; l < len; l++) {
                        file = ref1[l];
                        this.loadImageFile(file);
                        break;
                      }
                    }
                  });
                });
              });
            });
            child('label', () => {
              var ref1;
              child('p', () => {
                raw('USER INSTRUCTIONS ');
                return child('a', {
                  href: 'https://daringfireball.net/projects/markdown/syntax',
                  target: '_blank'
                }, () => {
                  return child('i', () => {
                    raw('markdown supported');
                  });
                });
              });
              child('p', () => {
                raw('Tell your users what you want them to do and why.');
              });
              return child('textarea.full-width-textarea', {
                ref: 'description',
                value: (ref1 = this.props.game.description) != null ? ref1 : '',
                onChange: this.handleChange
              });
            });
            return child('div', {
              dangerouslySetInnerHTML: renderMarkdown(this.props.game.description)
            });
          });
        });
        return child('div.newStep1Column.newStep1RightColumn');
      });
      return child('div.bottom-step-buttons', () => {
        child('div');
        return child('a', {
          href: '#new3'
        }, () => {
          props({
            onClick: (e) => {
              if (!hasNameDesc(this.props.game)) {
                alert('Please enter a name and user instructions for your Siftr.');
                return e.preventDefault();
              }
            }
          });
          return child('div.newNextButton', () => {
            raw('map >');
          });
        });
      });
    });
  },
  selectImage: function() {
    var input;
    input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      return this.loadImageFile(e.target.files[0]);
    };
    return input.click();
  },
  loadImageFile: function(file) {
    var fr;
    fr = new FileReader;
    fr.onload = () => {
      return this.props.onIconChange(fr.result);
    };
    return fr.readAsDataURL(file);
  },
  handleChange: function() {
    var game;
    game = update(this.props.game, {
      name: {
        $set: this.refs.name.value
      },
      description: {
        $set: this.refs.description.value
      }
    });
    return this.props.onChange(game);
  }
});

const MapOptions = React.createClass({
  displayName: 'MapOptions',
  getInitialState: function() {
    return {
      tab: 'focus'
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    // This prevents the map from jerking back.
    // The number comparisons are needed due to tiny floating point errors.
    if (this.props.editing !== nextProps.editing) return true;
    if (Math.abs(this.props.game.latitude - nextProps.game.latitude) > 0.0000001) return true;
    if (Math.abs(this.props.game.longitude - nextProps.game.longitude) > 0.0000001) return true;
    if (this.props.game.zoom !== nextProps.game.zoom) return true;
    if (this.props.game.type !== nextProps.game.type) return true;
    if (this.state.tab !== nextState.tab) return true;
    if (this.props.game.colors_id !== nextProps.game.colors_id) return true;
    if (this.props.game.theme_id !== nextProps.game.theme_id) return true;
    if (this.props.game.map_show_labels !== nextProps.game.map_show_labels) return true;
    if (this.props.game.map_show_roads !== nextProps.game.map_show_roads) return true;
    if (this.props.game.map_type !== nextProps.game.map_type) return true;
    return false;
  },
  getMapStyles: function(props = this.props) {
    var styles, theme;
    styles = [];
    if (((theme = props.themes[props.game.theme_id]) != null) && props.game.map_type === 'STREET') {
      styles = JSON.parse(theme.gmaps_styles);
    }
    styles.push({
      featureType: 'transit',
      stylers: [
        {
          visibility: 'off'
        }
      ]
    });
    styles.push({
      featureType: 'poi',
      stylers: [
        {
          visibility: 'off'
        }
      ]
    });
    if (!props.game.map_show_roads) {
      styles.push({
        featureType: 'road',
        stylers: [
          {
            visibility: 'off'
          }
        ]
      });
    }
    if (!props.game.map_show_labels) {
      styles.push({
        elementType: 'labels',
        stylers: [
          {
            visibility: 'off'
          }
        ]
      });
      styles.push({
        featureType: 'administrative.land_parcel',
        stylers: [
          {
            visibility: 'off'
          }
        ]
      });
      styles.push({
        featureType: 'administrative.neighborhood',
        stylers: [
          {
            visibility: 'off'
          }
        ]
      });
    }
    return styles;
  },
  render: function() {
    return make('div.newStepBox', () => {
      child('div.newStep3', () => {
        child('div.newStep3Controls', () => {
          child('div.newStep3Tabs', () => {
            var makeTab, makeTabDivider;
            makeTab = (tab, alt) => {
              return child('div.newStep3Tab', () => {
                child('a', {
                  href: '#',
                  alt: alt
                }, () => {
                  props({
                    onClick: (e) => {
                      e.preventDefault();
                      this.setState({
                        tab: tab
                      });
                    }
                  });
                  return child('img', {
                    src: `../assets/icons/icon-${tab}.png`,
                    className: this.state.tab === tab ? '' : 'map-tab-off'
                  });
                });
                return child(`div.newStep3TabArrow${(this.state.tab === 'focus' ? '.newStep3GrayBG' : '')}`, () => {
                  if (this.state.tab === tab) {
                    return child('img', {
                      src: `../assets/icons/map-options-arrow${(tab === 'focus' ? '-gray' : '')}.png`
                    });
                  }
                });
              });
            };
            makeTabDivider = () => {
              return child('div.newStep3Tab.newStep3TabDividerBox', () => {
                child('div.newStep3TabDivider');
                return child(`div.newStep3TabArrow${(this.state.tab === 'focus' ? '.newStep3GrayBG' : '')}`);
              });
            };
            makeTab('focus', 'Focus');
            makeTabDivider();
            makeTab('theme', 'Theme');
            makeTabDivider();
            return makeTab('pins', 'Pins');
          });
          return child(`div.newStep3-control.newStep3-control-${this.state.tab}`, () => {
            var location, makeCard;
            switch (this.state.tab) {
              case 'theme':
                child('h2', () => {
                  raw('Select Map Theme');
                });
                makeCard = (image, text, selected, updater) => {
                  return child('a.theme-card', {
                    href: '#'
                  }, () => {
                    props({
                      onClick: (e) => {
                        e.preventDefault();
                        return this.props.onChange(update(this.props.game, updater));
                      }
                    });
                    child('img.theme-card-image', {
                      src: image
                    });
                    child('div.theme-card-name', () => {
                      raw(text);
                    });
                    return child('div.theme-card-check', () => {
                      return child('img', {
                        src: `../assets/icons/radio-${(selected ? 'on' : 'off')}.png`
                      });
                    });
                  });
                };
                Object.values(this.props.themes).forEach((theme) => {
                  var image, selected, updater;
                  image = (function() {
                    switch (theme.name) {
                      case 'Classic Siftr':
                        return 'classic';
                      case 'Aubergine':
                        return 'midnight';
                      case 'Retro':
                        return 'retro';
                      case 'Silver':
                        return 'silver';
                    }
                  })();
                  selected = this.props.game.theme_id === theme.theme_id && this.props.game.map_type === 'STREET';
                  updater = {
                    theme_id: {
                      $set: theme.theme_id
                    },
                    map_type: {
                      $set: 'STREET'
                    }
                  };
                  return makeCard(`../assets/icons/theme-${image}.png`, theme.name, selected, updater);
                });
                makeCard('../assets/icons/theme-satellite.png', 'Satellite', this.props.game.map_type === 'HYBRID', {
                  map_type: {
                    $set: 'HYBRID'
                  }
                });
                child('h2', () => {
                  raw('Map Options');
                });
                child(`a.form-multi-option.form-multi-option-${(this.props.game.map_show_labels ? 'on' : 'off')}`, {
                  href: '#'
                }, () => {
                  props({
                    onClick: (e) => {
                      e.preventDefault();
                      return this.props.onChange(update(this.props.game, {
                        map_show_labels: {
                          $set: !this.props.game.map_show_labels
                        }
                      }));
                    }
                  });
                  child('span.form-multi-option-text', () => {
                    raw('Show labels');
                  });
                  return child('span.form-multi-option-switch', () => {
                    return child('span.form-multi-option-ball');
                  });
                });
                return child(`a.form-multi-option.form-multi-option-${(this.props.game.map_show_roads ? 'on' : 'off')}`, {
                  href: '#'
                }, () => {
                  props({
                    onClick: (e) => {
                      e.preventDefault();
                      return this.props.onChange(update(this.props.game, {
                        map_show_roads: {
                          $set: !this.props.game.map_show_roads
                        }
                      }));
                    }
                  });
                  child('span.form-multi-option-text', () => {
                    raw('Show roads');
                  });
                  return child('span.form-multi-option-switch', () => {
                    return child('span.form-multi-option-ball');
                  });
                });
              case 'pins':
                child('h2', () => {
                  raw('Select Category Theme');
                });
                return Object.values(this.props.colors).forEach((colors) => {
                  var j, rgbs;
                  rgbs = (function() {
                    var l, results;
                    if (colors != null) {
                      results = [];
                      for (j = l = 1; l <= 5; j = ++l) {
                        results.push(colors[`tag_${j}`]);
                      }
                      return results;
                    } else {
                      return [];
                    }
                  })();
                  return child('a.color-card', {
                    href: '#'
                  }, () => {
                    var l, len, rgb;
                    props({
                      onClick: (e) => {
                        e.preventDefault();
                        return this.props.onChange(update(this.props.game, {
                          colors_id: {
                            $set: colors.colors_id
                          }
                        }));
                      }
                    });
                    for (l = 0, len = rgbs.length; l < len; l++) {
                      rgb = rgbs[l];
                      child('div.color-card-pin', () => {
                        return child('div.siftr-map-note', () => {
                          return child('div.siftr-map-note-pin', {
                            style: {
                              backgroundColor: rgb
                            }
                          });
                        });
                      });
                    }
                    child('div.color-card-name', () => {
                      raw(colors != null ? colors.name : undefined);
                    });
                    return child('div.theme-card-check', () => {
                      return child('img', {
                        src: `../assets/icons/radio-${(this.props.game.colors_id === colors.colors_id ? 'on' : 'off')}.png`
                      });
                    });
                  });
                });
              case 'focus':
                child('h2', () => {
                  raw('Choose Map Focus');
                });
                location = this.props.game.type !== 'ANYWHERE';
                return child('div.newStep3FocusBlock', () => {
                  child('div.newStep3FocusButtons', () => {
                    var focusButton;
                    focusButton = (img, type) => {
                      return child('a', {
                        href: '#'
                      }, () => {
                        props({
                          onClick: (e) => {
                            e.preventDefault();
                            return this.props.onChange(update(this.props.game, {
                              type: {
                                $set: type
                              }
                            }));
                          }
                        });
                        return child('img', {
                          src: `../assets/icons/focus-${img}${(this.props.game.type === type ? '-on' : '')}.png`
                        });
                      });
                    };
                    focusButton('pins', 'ANYWHERE');
                    return focusButton('location', 'LOCATION');
                  });
                  child('div.newStep3FocusDivider');
                  if (this.props.game.type === 'ANYWHERE') {
                    child('h3', () => {
                      raw('Focus on Pins');
                    });
                    return child('p', () => {
                      raw('When someone views your Siftr, the map will start out zoomed out to encompass all of the pins in your Siftr.');
                    });
                  } else {
                    child('h3', () => {
                      raw('Focus on Location');
                    });
                    return child('p', () => {
                      raw('When someone views your Siftr, the map will start with the center point and zoom level you choose here.');
                    });
                  }
                });
            }
          });
        });
        return child('div.newStep3MapContainer', () => {
          var colors, i, l, results, rgb, styles;
          styles = this.getMapStyles();
          child(GoogleMap, {
            bootstrapURLKeys: {
              key: 'AIzaSyDlMWLh8Ho805A5LxA_8FgPOmnHI0AL9vw'
            },
            center: [this.props.game.latitude, this.props.game.longitude],
            zoom: Math.max(2, this.props.game.zoom),
            options: (maps) => {
              return {
                minZoom: 2,
                styles: styles,
                mapTypeId: (function() {
                  switch (this.props.game.map_type) {
                    case 'STREET':
                      return maps.MapTypeId.ROADMAP;
                    default:
                      return maps.MapTypeId.HYBRID;
                  }
                }).call(this)
              };
            },
            onChange: this.handleMapChange
          });
          colors = this.props.colors[this.props.game.colors_id];
          if (colors != null) {
            results = [];
            for (i = l = 1; l <= 5; i = ++l) {
              rgb = colors[`tag_${i}`];
              results.push(child('div.color-card-pin', () => {
                var coords;
                coords = [
                  { x: 269, y: 646 },
                  { x: 653, y: 1046 },
                  { x: 749, y: 124 },
                  { x: 896, y: 599 },
                  { x: 1472, y: 474 },
                ][i - 1];
                props({
                  style: {
                    position: 'absolute',
                    left: `${(coords.x / 1793) * 100}%`,
                    top: `${(coords.y / 1280) * 100}%`
                  }
                });
                return child('div.siftr-map-note', () => {
                  child('div.siftr-map-note-shadow');
                  return child('div.siftr-map-note-pin', {
                    style: {
                      backgroundColor: rgb
                    }
                  });
                });
              }));
            }
            return results;
          }
        });
      });
      if (this.props.editing) {
        return child('div.bottom-step-buttons', () => {
          child('a', {
            href: '#edit' + this.props.game.game_id
          }, () => {
            return child('div.newPrevButton', () => {
              raw('< settings');
            });
          });
          return child('a', {
            href: '#form' + this.props.game.game_id
          }, () => {
            return child('div.newNextButton', () => {
              raw('data >');
            });
          });
        });
      } else {
        return child('div.bottom-step-buttons', () => {
          child('a', {
            href: '#new1'
          }, () => {
            return child('div.newPrevButton', () => {
              raw('< setup');
            });
          });
          return child('a', {
            href: '#new4'
          }, () => {
            return child('div.newNextButton', () => {
              raw('data >');
            });
          });
        });
      }
    });
  },
  handleMapChange: function({
      center: {lat, lng},
      zoom
    }) {
    var game;
    game = update(this.props.game, {
      latitude: {
        $set: lat
      },
      longitude: {
        $set: lng
      },
      zoom: {
        $set: zoom
      }
    });
    return this.props.onChange(game);
  }
});

const makeArrow = (dir, enabled, wrap) => {
  const src = `../assets/icons/arrow-${dir}.png`;
  if (enabled) {
    wrap(() => {
      child('img.sort-arrow', {src});
    });
  } else {
    child('img.sort-arrow.sort-arrow-disabled', {src});
  }
};

const CategoryRow = React.createClass({
  getInitialState: function() {
    return {
      colorsOpen: false
    };
  },
  updateOption: function(opt) {
    var opts;
    opts = this.props.options.slice(0);
    opts.splice(this.props.i, 1, opt);
    return this.props.updateOptions(opts);
  },
  render: function() {
    var colors, i, j, o, options;
    o = this.props.o;
    i = this.props.i;
    options = this.props.options;
    colors = (function() {
      var l, results;
      results = [];
      for (j = l = 1; l <= 8; j = ++l) {
        results.push(this.props.colors[this.props.game.colors_id || 1][`tag_${j}`]);
      }
      return results;
    }).call(this);
    return make('div', () => {
      child('li.field-option-row', () => {
        var color;
        makeArrow('up', i !== 0, (f) => {
          child('a', {
            href: '#',
            onClick: ((e) => {
              var indexes;
              e.preventDefault();
              indexes = (function() {
                var l, ref1, results;
                results = [];
                for (j = l = 0, ref1 = options.length - 1; (0 <= ref1 ? l <= ref1 : l >= ref1); j = 0 <= ref1 ? ++l : --l) {
                  if (j === i) {
                    results.push(j - 1);
                  } else if (j === i - 1) {
                    results.push(j + 1);
                  } else {
                    results.push(j);
                  }
                }
                return results;
              })();
              return this.props.reorderFieldOptions(indexes);
            })
          }, f);
        });
        makeArrow('down', i !== options.length - 1, (f) => {
          return child('a', {
            href: '#',
            onClick: ((e) => {
              var indexes;
              e.preventDefault();
              indexes = (function() {
                var l, ref1, results;
                results = [];
                for (j = l = 0, ref1 = options.length - 1; (0 <= ref1 ? l <= ref1 : l >= ref1); j = 0 <= ref1 ? ++l : --l) {
                  if (j === i) {
                    results.push(j + 1);
                  } else if (j === i + 1) {
                    results.push(j - 1);
                  } else {
                    results.push(j);
                  }
                }
                return results;
              })();
              return this.props.reorderFieldOptions(indexes);
            })
          }, f);
        });
        if (this.props.isLockedField) {
          color = o.color || colors[i % 8];
          child('a', {
            href: '#'
          }, () => {
            props({
              onClick: (e) => {
                e.preventDefault();
                this.setState({
                  colorsOpen: !this.state.colorsOpen
                });
              }
            });
            return child('div.category-color-dot', {
              style: {
                backgroundColor: color
              }
            });
          });
        }
        if (this.props.editing) {
          child('input', {
            type: 'text',
            defaultValue: o.option,
            onBlur: (e) => {
              if (this.props.editingCategory) {
                return this.props.updateCategory({
                  tag_id: o.field_option_id,
                  name: e.target.value
                });
              } else {
                return this.props.updateFieldOption({
                  field_option: o,
                  option: e.target.value
                });
              }
            }
          });
        } else {
          child('input', {
            type: 'text',
            value: o.option,
            onChange: (e) => {
              return this.updateOption(update(o, {
                option: {
                  $set: e.target.value
                }
              }));
            }
          });
        }
        if (options.length > 1) {
          return child('a', {
            href: '#',
            onClick: ((e) => {
              var opts;
              e.preventDefault();
              if (this.props.editing) {
                return this.startDeletingOption(o);
              } else {
                opts = options.slice(0);
                opts.splice(i, 1);
                return this.props.updateOptions(opts);
              }
            })
          }, () => {
            return child('img.deletefield', {
              src: '../assets/icons/deletefield.png'
            });
          });
        }
      });
      if (this.state.colorsOpen) {
        return child('li.category-color-dots', () => {
          return colors.forEach((color) => {
            return child('a', {
              href: '#'
            }, () => {
              props({
                onClick: (e) => {
                  e.preventDefault();
                  if (this.props.editing) {
                    // must be a category
                    this.props.updateCategory({
                      tag_id: o.field_option_id,
                      color: color
                    });
                  } else {
                    this.updateOption(update(o, {
                      color: {
                        $set: color
                      }
                    }));
                  }
                  this.setState({
                    colorsOpen: false
                  });
                }
              });
              return child('div.category-color-dot', {
                style: {
                  backgroundColor: color
                }
              });
            });
          });
        });
      }
    });
  }
});

const FormEditor = React.createClass({
  displayName: 'FormEditor',
  getInitialState: function() {
    return {
      editingIndex: null,
      editingField: null,
      deletingOption: null,
      showFieldTypes: false
    };
  },
  reorderFields: function(indexes) {
    var fixIndex, i;
    fixIndex = () => {
      if ((this.state.editingIndex != null) && this.state.editingIndex >= 0) {
        this.setState({
          editingIndex: indexes[this.state.editingIndex]
        });
      }
    };
    if (this.props.editing) {
      return this.props.reorderFields(indexes, fixIndex);
    } else {
      fixIndex();
      return this.props.onChange(update(this.props.game, {
        fields: {
          $set: (function() {
            var l, ref1, results;
            results = [];
            for (i = l = 0, ref1 = indexes.length - 1; (0 <= ref1 ? l <= ref1 : l >= ref1); i = 0 <= ref1 ? ++l : --l) {
              results.push(this.props.game.fields[indexes[i]]);
            }
            return results;
          }).call(this)
        }
      }));
    }
  },
  reorderFieldOptions: function(indexes, cb) {
    var i;
    if (this.props.editing) {
      if (this.state.editingIndex < 0) {
        return this.props.reorderCategories(indexes, cb);
      } else {
        return this.props.reorderFieldOptions(this.state.editingField, indexes, cb);
      }
    } else {
      this.setState({
        editingField: update(this.state.editingField, {
          options: {
            $set: (function() {
              var l, ref1, results;
              results = [];
              for (i = l = 0, ref1 = indexes.length - 1; (0 <= ref1 ? l <= ref1 : l >= ref1); i = 0 <= ref1 ? ++l : --l) {
                results.push(this.state.editingField.options[indexes[i]]);
              }
              return results;
            }).call(this)
          }
        })
      });
    }
  },
  getPropsFields: function(props = this.props) {
    var ref1, ref2;
    if (props.editing) {
      return (ref1 = props.fields) != null ? ref1 : [];
    } else {
      return (ref2 = props.game.fields) != null ? ref2 : [];
    }
  },
  componentWillReceiveProps: function(nextProps) {
    var index, nextFields, thisFields;
    thisFields = this.getPropsFields(this.props);
    nextFields = this.getPropsFields(nextProps);
    if (thisFields.length + 1 === nextFields.length) {
      index = nextFields.length - 1;
      this.setState({
        editingIndex: index,
        editingField: nextFields[index],
        deletingOption: null
      });
    }
  },
  render: function() {
    return make('div.newStepBox', () => {
      var categoryOptions, fields;
      fields = this.getPropsFields();
      categoryOptions = () => {
        var cat, i, l, len, len1, m, ref1, ref2, ref3, results, results1;
        if (this.props.editing) {
          ref2 = (ref1 = this.props.categories) != null ? ref1 : [];
          results = [];
          for (l = 0, len = ref2.length; l < len; l++) {
            cat = ref2[l];
            results.push({
              option: cat.tag,
              field_option_id: cat.tag_id,
              color: cat.color
            });
          }
          return results;
        } else {
          ref3 = this.props.categories;
          results1 = [];
          for (i = m = 0, len1 = ref3.length; m < len1; i = ++m) {
            cat = ref3[i];
            results1.push({
              option: cat.category,
              field_option_id: i,
              color: cat.color
            });
          }
          return results1;
        }
      };
      child('div.newStep4', () => {
        child('div.newStep4Fields', () => {
          var divFormFieldRow, lockedFields;
          divFormFieldRow = (i) => {
            var row;
            row = 'div.form-field-row';
            if (i === this.state.editingIndex) {
              row += '.form-field-row-selected';
            }
            return row;
          };
          lockedFields = [
            new Field({
              field_type: 'MEDIA',
              label: 'Main Photo',
              required: true
            }),
            new Field({
              field_type: 'TEXTAREA',
              label: 'Caption',
              required: true
            }),
            new Field({
              field_type: 'SINGLESELECT',
              label: 'Category',
              required: true,
              options: categoryOptions()
            })
          ];
          lockedFields.forEach((field, i) => {
            i -= lockedFields.length; // so they go -3, -2, -1
            return child(divFormFieldRow(i), {
              key: field.label
            }, () => {
              child('div.form-field-icon', () => {
                return child('img', {
                  src: `../assets/icons/form-${field.field_type}.png`
                });
              });
              child('a.form-field-name', {
                href: '#',
                onClick: (e) => {
                  e.preventDefault();
                  this.setState({
                    editingField: field,
                    editingIndex: i,
                    deletingOption: null
                  });
                }
              }, () => {
                raw(field.label || 'Unnamed field');
                if (field.required) {
                  raw(' ');
                  return child('span.required-star', () => {
                    raw('*');
                  });
                }
              });
              return child('div.lock-icon', () => {
                return child('img', {
                  src: "../assets/icons/lock.png"
                });
              });
            });
          });
          fields.forEach((field, i) => {
            return child(divFormFieldRow(i), {
              key: field.field_id
            }, () => {
              child('div.form-field-icon', () => {
                return child('img', {
                  src: `../assets/icons/form-${field.field_type}.png`
                });
              });
              child('a.form-field-name', {
                href: '#',
                onClick: (e) => {
                  e.preventDefault();
                  this.setState({
                    editingField: field,
                    editingIndex: i,
                    deletingOption: null
                  });
                }
              }, () => {
                raw(field.label || 'Unnamed field');
                if (field.required) {
                  raw(' ');
                  return child('span.required-star', () => {
                    raw('*');
                  });
                }
              });
              return child('div.form-field-x', () => {
                makeArrow('up', i !== 0, (f) => {
                  return child('a', {
                    href: '#',
                    onClick: ((e) => {
                      var j;
                      e.preventDefault();
                      e.stopPropagation();
                      return this.reorderFields((function() {
                        var l, ref1, results;
                        results = [];
                        for (j = l = 0, ref1 = fields.length - 1; (0 <= ref1 ? l <= ref1 : l >= ref1); j = 0 <= ref1 ? ++l : --l) {
                          if (j === i) {
                            results.push(j - 1);
                          } else if (j === i - 1) {
                            results.push(j + 1);
                          } else {
                            results.push(j);
                          }
                        }
                        return results;
                      })());
                    })
                  }, f);
                });
                makeArrow('down', i !== fields.length - 1, (f) => {
                  return child('a', {
                    href: '#',
                    onClick: ((e) => {
                      var j;
                      e.preventDefault();
                      e.stopPropagation();
                      return this.reorderFields((function() {
                        var l, ref1, results;
                        results = [];
                        for (j = l = 0, ref1 = fields.length - 1; (0 <= ref1 ? l <= ref1 : l >= ref1); j = 0 <= ref1 ? ++l : --l) {
                          if (j === i) {
                            results.push(j + 1);
                          } else if (j === i + 1) {
                            results.push(j - 1);
                          } else {
                            results.push(j);
                          }
                        }
                        return results;
                      })());
                    })
                  }, f);
                });
                return child('a', {
                  href: '#',
                  onClick: ((e) => {
                    var newFields;
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.props.editing) {
                      if (confirm(`Are you sure you want to delete the ${field.label || 'unnamed'} field?`)) {
                        return this.props.deleteField(field);
                      }
                    } else {
                      newFields = fields.slice(0);
                      newFields.splice(i, 1);
                      this.props.onChange(update(this.props.game, {
                        fields: {
                          $set: newFields
                        }
                      }));
                      if (i < this.state.editingIndex) {
                        this.setState({
                          editingIndex: this.state.editingIndex - 1
                        });
                      } else if (i === this.state.editingIndex) {
                        this.setState({
                          editingIndex: null,
                          editingField: null
                        });
                      }
                    }
                  })
                }, () => {
                  return child('span.deleterow', () => {
                    raw('delete');
                  });
                });
              });
            });
          });
          if (this.state.showFieldTypes) {
            child('p', () => {
              return child('a.form-hide-types', {
                href: '#',
                onClick: ((e) => {
                  e.preventDefault();
                  this.setState({
                    showFieldTypes: false
                  });
                })
              }, () => {
                child('img.form-show-types-plus', {
                  src: '../assets/icons/field-x.png'
                });
                return child('span.form-show-types-label', () => {
                  raw('cancel');
                });
              });
            });
            return child('p', () => {
              var types;
              types = [['TEXT', 'small text field'], ['TEXTAREA', 'large text field'], ['SINGLESELECT', 'single choice'], ['MULTISELECT', 'multiple choice'], ['MEDIA', 'extra photo']];
              return types.forEach(([type, name], i) => {
                return child('a.form-add-field', {
                  href: '#',
                  onClick: ((e) => {
                    e.preventDefault();
                    this.setState({
                      showFieldTypes: false
                    });
                    if (this.props.editing) {
                      return this.props.addField(type);
                    } else {
                      return this.props.onChange(update(this.props.game, {
                        fields: {
                          $set: fields.concat([
                            new Field({
                              field_type: type,
                              label: '',
                              required: false,
                              field_id: Date.now(), // temporary, to use as React key
                              options: (function() {
                                switch (type) {
                                  case 'SINGLESELECT':
                                  case 'MULTISELECT':
                                    return [
                                      {
                                        option: '',
                                        field_option_id: Date.now()
                                      }
                                    ];
                                  default:
                                    return undefined;
                                }
                              })()
                            })
                          ])
                        }
                      }));
                    }
                  })
                }, () => {
                  child('img', {
                    src: `../assets/icons/form-${type}.png`
                  });
                  child('br');
                  raw(name);
                });
              });
            });
          } else {
            return child('p', () => {
              return child('a.form-show-types', {
                href: '#',
                onClick: ((e) => {
                  e.preventDefault();
                  this.setState({
                    showFieldTypes: true
                  });
                })
              }, () => {
                child('img.form-show-types-plus', {
                  src: '../assets/icons/field-plus.png'
                });
                return child('span.form-show-types-label', () => {
                  raw('add new field');
                });
              });
            });
          }
        });
        return child('div.newStep4FieldInfo', () => {
          var confirmDelete, editingCategory, field, isLockedField, options, ref1, ref2, ref3, ref4, ref5, reloadThisField, req;
          if ((field = this.state.editingField) != null) {
            isLockedField = this.state.editingIndex < 0;
            reloadThisField = () => {
              var f, i, l, len, ref1;
              if (isLockedField) {
                if (field.field_type === 'SINGLESELECT') {
                  this.setState({
                    editingField: new Field({
                      field_type: 'SINGLESELECT',
                      label: 'Category',
                      required: true,
                      options: categoryOptions()
                    }),
                    deletingOption: null
                  });
                }
              } else {
                ref1 = this.props.fields;
                for (i = l = 0, len = ref1.length; l < len; i = ++l) {
                  f = ref1[i];
                  if (f.field_id === field.field_id) {
                    this.setState({
                      editingField: f,
                      editingIndex: i,
                      deletingOption: null
                    });
                    return;
                  }
                }
              }
            };
            if (this.state.deletingOption != null) {
              child('p', () => {
                if (isLockedField) {
                  raw(`Choose a category to reassign all '${this.state.deletingOption.option}' notes to.`);
                } else {
                  raw(`Should data be reassigned from '${this.state.deletingOption.option}' to a different option?`);
                }
              });
              confirmDelete = (new_option) => {
                var msg;
                msg = new_option != null ? `Are you sure you want to delete the option '${this.state.deletingOption.option}' and reassign its notes to '${new_option.option}'?` : `Are you sure you want to delete the option '${this.state.deletingOption.option}'?`;
                if (confirm(msg)) {
                  if (isLockedField) {
                    return this.props.deleteCategory({
                      tag_id: this.state.deletingOption.field_option_id,
                      new_tag_id: new_option.field_option_id
                    }, reloadThisField);
                  } else {
                    return this.props.deleteFieldOption({
                      field_option: this.state.deletingOption,
                      new_field_option: new_option
                    }, reloadThisField);
                  }
                }
              };
              child('ul', () => {
                var ref1;
                return ((ref1 = field.options) != null ? ref1 : []).forEach((o) => {
                  if (o.field_option_id !== this.state.deletingOption.field_option_id) {
                    return child('li', {
                      key: o.field_option_id
                    }, () => {
                      return child('a', {
                        href: '#',
                        onClick: (e) => {
                          e.preventDefault();
                          return confirmDelete(o);
                        }
                      }, () => {
                        raw(o.option);
                      });
                    });
                  }
                });
              });
              if (!isLockedField) {
                child('p', () => {
                  return child('a', {
                    href: '#',
                    onClick: (e) => {
                      e.preventDefault();
                      return confirmDelete(null);
                    }
                  }, () => {
                    raw("Don't reassign");
                  });
                });
              }
              return child('p', () => {
                return child('a', {
                  href: '#',
                  onClick: (e) => {
                    e.preventDefault();
                    this.setState({
                      deletingOption: null
                    });
                  }
                }, () => {
                  raw("Cancel");
                });
              });
            } else {
              child('div.inspectortitle', () => {
                child('img.inspectoricon', {
                  src: `../assets/icons/form-${field.field_type}.png`
                });
                return child('h2', () => {
                  if (isLockedField) {
                    raw(field.label);
                  } else {
                    switch (field.field_type) {
                      case 'TEXT':
                        return raw('Small text field');
                      case 'TEXTAREA':
                        return raw('Large text field');
                      case 'MEDIA':
                        return raw('Image upload');
                      case 'SINGLESELECT':
                        return raw('Single choice');
                      case 'MULTISELECT':
                        return raw('Multiple choice');
                    }
                  }
                });
              });
              if (!isLockedField) {
                child('div.inspector-question', () => {
                  return child('input', {
                    type: 'textarea',
                    value: field.label,
                    placeholder: 'What Question are you asking?',
                    onChange: (e) => {
                      this.setState({
                        editingField: update(field, {
                          label: {
                            $set: e.target.value
                          }
                        })
                      });
                    }
                  });
                });
                if ((ref1 = field.field_type) !== 'SINGLESELECT' && ref1 !== 'MULTISELECT') {
                  req = field.required;
                  child(`a.form-multi-option.form-multi-option-${(req ? 'on' : 'off')}`, {
                    href: '#'
                  }, () => {
                    props({
                      onClick: (e) => {
                        e.preventDefault();
                        this.setState({
                          editingField: update(field, {
                            required: {
                              $set: !req
                            }
                          })
                        });
                      }
                    });
                    child('span.form-multi-option-text', () => {
                      raw('Required');
                    });
                    return child('span.form-multi-option-switch', () => {
                      return child('span.form-multi-option-ball');
                    });
                  });
                }
              }
              if (field.field_type === 'TEXTAREA' && isLockedField) {
                if (this.props.editing) {
                  child('textarea.full-width-textarea', {
                    placeholder: 'Pre-filled caption text',
                    defaultValue: (ref2 = this.props.game.prompt) != null ? ref2 : '',
                    ref: 'caption'
                  });
                } else {
                  child('textarea.full-width-textarea', {
                    placeholder: 'Pre-filled caption text',
                    value: (ref3 = this.props.game.prompt) != null ? ref3 : '',
                    onChange: (e) => {
                      return this.props.onChange(update(this.props.game, {
                        prompt: {
                          $set: e.target.value
                        }
                      }));
                    }
                  });
                }
              }
              if ((ref4 = field.field_type) === 'SINGLESELECT' || ref4 === 'MULTISELECT') {
                editingCategory = this.props.editing && isLockedField;
                options = (ref5 = field.options) != null ? ref5 : [];
                child('ul', () => {
                  options.forEach((o, i) => {
                    return child(CategoryRow, {
                      key: o.field_option_id,
                      o: o,
                      i: i,
                      game: this.props.game,
                      colors: this.props.colors,
                      options: options,
                      isLockedField: isLockedField,
                      editing: this.props.editing,
                      editingCategory: editingCategory,
                      reorderFieldOptions: (indexes) => {
                        return this.reorderFieldOptions(indexes, reloadThisField);
                      },
                      startDeletingOption: (o) => {
                        this.setState({
                          deletingOption: o
                        });
                      },
                      updateOptions: (opts) => {
                        this.setState({
                          editingField: update(field, {
                            options: {
                              $set: opts
                            }
                          })
                        });
                      },
                      updateCategory: (obj) => {
                        return this.props.updateCategory(obj, reloadThisField);
                      },
                      updateFieldOption: (obj) => {
                        return this.props.updateFieldOption(obj, reloadThisField);
                      }
                    });
                  });
                  return child('li', () => {
                    return child('a', {
                      onClick: (() => {
                        if (this.props.editing) {
                          if (editingCategory) {
                            return this.props.addCategory({
                              name: ''
                            }, reloadThisField);
                          } else {
                            return this.props.addFieldOption({
                              field: field,
                              option: ''
                            }, reloadThisField);
                          }
                        } else {
                          this.setState({
                            editingField: update(field, {
                              options: {
                                $set: options.concat([
                                  {
                                    option: '',
                                    field_option_id: Date.now()
                                  }
                                ])
                              }
                            })
                          });
                        }
                      })
                    }, () => {
                      return child('span.addoption_btn', () => {
                        child('img.addoption', {
                          src: '../assets/icons/addfield.png'
                        });
                        raw('add answer');
                      });
                    });
                  });
                });
              }
              return child('p.savebutton', () => {
                return child('span.button', {
                  onClick: () => {
                    if (isLockedField) {
                      switch (field.field_type) {
                        case 'TEXTAREA':
                          if (this.props.editing) {
                            this.props.setPrompt(this.refs.caption.value);
                          }
                          break;
                        case 'SINGLESELECT':
                          if (!this.props.editing) {
                            this.props.onChangeCategories(field.options.map((o) => {
                              return {
                                category: o.option,
                                color: o.color
                              };
                            }));
                          }
                      }
                    } else if (this.props.editing) {
                      this.props.updateField(field);
                    } else {
                      this.props.onChange(update(this.props.game, {
                        fields: singleObj(this.state.editingIndex, {
                          $set: field
                        })
                      }));
                    }
                    this.setState({
                      editingField: null,
                      editingIndex: null
                    });
                  }
                }, () => {
                  raw('Save field');
                });
              });
            }
          } else {
            return child('p', () => {
              raw('No field selected.');
            });
          }
        });
      });
      if (this.props.editing) {
        return child('div.bottom-step-buttons', () => {
          child('a', {
            href: '#map' + this.props.game.game_id
          }, () => {
            return child('div.newPrevButton', () => {
              raw('< map');
            });
          });
          return child('div');
        });
      } else {
        return child('div.bottom-step-buttons', () => {
          child('a', {
            href: '#new3'
          }, () => {
            return child('div.newPrevButton', () => {
              raw('< map');
            });
          });
          return child('a', {
            href: '#new5'
          }, () => {
            return child('div.newNextButton', () => {
              raw('share >');
            });
          });
        });
      }
    });
  }
});

const ShareOptions = React.createClass({
  displayName: 'ShareOptions',
  render: function() {
    return make('div.newStepBox', () => {
      child('div.newStep1', () => {
        child('div.newStep1Column.newStep1LeftColumn', () => {
          var hidden, moderated;
          child('h4', () => {
            raw('PRIVACY');
          });
          hidden = !this.props.game.published;
          child(`a.form-multi-option.form-multi-option-${(hidden ? 'on' : 'off')}`, {
            href: '#'
          }, () => {
            props({
              onClick: (e) => {
                e.preventDefault();
                return this.props.onChange(update(this.props.game, {
                  published: {
                    $set: hidden
                  }
                }));
              }
            });
            child('span.form-multi-option-text', () => {
              raw('Hide from search');
            });
            return child('span.form-multi-option-switch', () => {
              return child('span.form-multi-option-ball');
            });
          });
          // TODO uncomment/translate when native app has password support
          /*
          child 'p', =>
            raw 'Do you want to set a password to restrict access?'
          child 'p', =>
            child 'input.full-width-input',
          type: 'text'
          placeholder: 'Password (optional)'
          value: @props.game.password ? ''
          onChange: (e) => @props.onChange update @props.game, password: $set: e.target.value
          */
          moderated = this.props.game.moderated;
          child(`a.form-multi-option.form-multi-option-${(moderated ? 'on' : 'off')}`, {
            href: '#'
          }, () => {
            props({
              onClick: (e) => {
                e.preventDefault();
                return this.props.onChange(update(this.props.game, {
                  moderated: {
                    $set: !moderated
                  }
                }));
              }
            });
            child('span.form-multi-option-text', () => {
              raw('Require moderation?');
            });
            return child('span.form-multi-option-switch', () => {
              return child('span.form-multi-option-ball');
            });
          });
          child('h4', () => {
            raw('PROJECT LINK');
          });
          child('p', () => {
            var ref1;
            return child('input.full-width-input', {
              type: 'text',
              placeholder: 'Identifier (optional)',
              value: (ref1 = this.props.game.siftr_url) != null ? ref1 : '',
              onChange: (e) => {
                return this.props.onChange(update(this.props.game, {
                  siftr_url: {
                    $set: e.target.value
                  }
                }));
              }
            });
          });
          if (this.props.game.siftr_url) {
            child('p', () => {
              child('b', () => {
                raw(this.props.game.name);
              });
              raw(" will be located at ");
              return child('code', () => {
                raw(`${SIFTR_URL}${this.props.game.siftr_url}`);
              });
            });
            return child('p', () => {
              raw('Or in the mobile app, enter ');
              child('code', () => {
                raw(this.props.game.siftr_url);
              });
              raw(' in the search bar.');
            });
          } else {
            return child('p', () => {
              raw("Enter a custom identifier for your Siftr's web address.");
            });
          }
        });
        return child('div.newStep1Column.newStep1RightColumn');
      });
      return child('div.bottom-step-buttons', () => {
        child('a', {
          href: '#new4'
        }, () => {
          return child('div.newPrevButton', () => {
            raw('< data');
          });
        });
        return child('a', {
          href: "#"
        }, () => {
          props({
            onClick: (e) => {
              e.preventDefault();
              return this.props.onCreate();
            }
          });
          return child('div.newNextButton', () => {
            raw('publish!');
          });
        });
      });
    });
  }
});

document.addEventListener('DOMContentLoaded', function(event) {
  return ReactDOM.render(make(App, {
    aris: new Aris
  }), document.getElementById('the-container'));
});
