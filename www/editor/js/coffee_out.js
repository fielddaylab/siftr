(function() {
  var App, app,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  App = (function() {
    function App() {
      $(function() {
        return FastClick.attach(document.body);
      });
      $(document).ready((function(_this) {
        return function() {
          _this.aris = new Aris;
          _this.isLoading = false;
          _this.selectPage('#page-loading');
          _this.isLoading = true;
          $('#button-login').click(function() {
            $('#spinner-login').show();
            _this.login($('#text-username').val(), $('#text-password').val(), function() {
              $('#spinner-login').hide();
              if (_this.aris.auth != null) {
                return _this.startingPage();
              } else {
                return _this.showAlert('Incorrect username or password.');
              }
            });
            return false;
          });
          $('#button-create-acct').click(function() {
            if (indexOf.call($('#text-new-email').val(), '@') < 0) {
              _this.showAlert("Your email address is not valid.");
            } else if ($('#text-new-username').val().length < 1) {
              _this.showAlert("Your username must be at least 1 character.");
            } else if ($('#text-new-password').val() !== $('#text-new-password-2').val()) {
              _this.showAlert("Your passwords do not match.");
            } else if ($('#text-new-password').val().length < 6) {
              _this.showAlert("Your password must be at least 6 characters.");
            } else {
              _this.aris.call('users.createUser', {
                user_name: $('#text-new-username').val(),
                password: $('#text-new-password').val(),
                email: $('#text-new-email').val()
              }, function(res) {
                if (res.returnCode !== 0) {
                  return _this.showAlert("Couldn't create account: " + res.returnCodeDescription);
                } else {
                  _this.parseLogin(res);
                  return _this.updateGameList(function() {
                    return _this.startingPage();
                  });
                }
              });
            }
            return false;
          });
          $('#button-change-password').click(function() {
            if ($('#text-change-password').val() !== $('#text-change-password-2').val()) {
              _this.showAlert("Your new passwords do not match.");
            } else if ($('#text-change-password').val().length < 6) {
              _this.showAlert("Your new password must be at least 6 characters.");
            } else {
              _this.aris.call('users.changePassword', {
                user_name: _this.aris.auth.username,
                old_password: $('#text-old-password').val(),
                new_password: $('#text-change-password').val()
              }, function(res) {
                if (res.returnCode !== 0) {
                  return _this.showAlert("Couldn't change password: " + res.returnCodeDescription);
                } else {
                  _this.parseLogin(res);
                  return _this.startingPage();
                }
              });
            }
            return false;
          });
          $('#text-siftr-url').change(function() {
            return _this.previewURL();
          });
          $('#text-siftr-url').keyup(function() {
            return _this.previewURL();
          });
          $('#add-editor-username').keydown(function(event) {
            if (event.keyCode === 13) {
              $('#add-editor-button').click();
              $('#add-editor-username').blur();
              return false;
            }
          });
          $(window).on('hashchange', function() {
            return _this.goToHash();
          });
          _this.updateNav();
          return _this.login(void 0, void 0, function() {
            _this.isLoading = false;
            return _this.goToHash();
          });
        };
      })(this));
    }

    App.prototype.showAlert = function(str, good) {
      if (good == null) {
        good = false;
      }
      $('#the-alert').text(str);
      if (good) {
        $('#the-alert').removeClass('alert-danger');
        $('#the-alert').addClass('alert-success');
      } else {
        $('#the-alert').removeClass('alert-success');
        $('#the-alert').addClass('alert-danger');
      }
      return $('#the-alert').show();
    };

    App.prototype.startingPage = function() {
      if (this.aris.auth != null) {
        return this.selectPage('#page-list');
      } else {
        return this.selectPage('#page-login');
      }
    };

    App.prototype.updateNav = function() {
      if (this.aris.auth != null) {
        $('#span-username').text(this.aris.auth.username);
        $('#dropdown-logged-in').show();
        return $('#nav-left-logged-in').show();
      } else {
        $('#dropdown-logged-in').hide();
        return $('#nav-left-logged-in').hide();
      }
    };

    App.prototype.parseLogin = function(obj) {
      this.aris.parseLogin(obj);
      return this.updateNav();
    };

    App.prototype.login = function(username, password, cb) {
      if (cb == null) {
        cb = (function() {});
      }
      return this.aris.login(username, password, (function(_this) {
        return function() {
          _this.updateNav();
          return _this.updateGameList(cb);
        };
      })(this));
    };

    App.prototype.logout = function() {
      this.aris.logout();
      return this.updateNav();
    };

    App.prototype.goToHash = function() {
      var g, game_id, games, h, res;
      h = document.location.hash;
      switch (h) {
        case '#password':
          if (this.aris.auth != null) {
            return this.selectPage('#page-change-password');
          } else {
            return this.startingPage();
          }
          break;
        case '#logout':
          this.logout();
          return document.location.hash = '';
        case '#join':
          if (this.aris.auth != null) {
            return this.startingPage();
          } else {
            return this.selectPage('#page-new-acct');
          }
          break;
        default:
          if (this.aris.auth != null) {
            if ((res = h.match(/^#edit(\d+)$/)) != null) {
              game_id = parseInt(res[1]);
              games = (function() {
                var j, len, ref, results;
                ref = this.games;
                results = [];
                for (j = 0, len = ref.length; j < len; j++) {
                  g = ref[j];
                  if (g.game_id === game_id) {
                    results.push(g);
                  }
                }
                return results;
              }).call(this);
              if (games.length !== 0) {
                return this.startEdit(games[0]);
              } else {
                return this.startingPage();
              }
            } else if ((res = h.match(/^#tags(\d+)$/)) != null) {
              game_id = parseInt(res[1]);
              games = (function() {
                var j, len, ref, results;
                ref = this.games;
                results = [];
                for (j = 0, len = ref.length; j < len; j++) {
                  g = ref[j];
                  if (g.game_id === game_id) {
                    results.push(g);
                  }
                }
                return results;
              }).call(this);
              if (games.length !== 0) {
                return this.startEditTags(games[0]);
              } else {
                return this.startingPage();
              }
            } else if ((res = h.match(/^#editors(\d+)$/)) != null) {
              game_id = parseInt(res[1]);
              games = (function() {
                var j, len, ref, results;
                ref = this.games;
                results = [];
                for (j = 0, len = ref.length; j < len; j++) {
                  g = ref[j];
                  if (g.game_id === game_id) {
                    results.push(g);
                  }
                }
                return results;
              }).call(this);
              if (games.length !== 0) {
                return this.startEditors(games[0]);
              } else {
                return this.startingPage();
              }
            } else {
              return this.startingPage();
            }
          } else {
            return this.startingPage();
          }
      }
    };

    App.prototype.selectPage = function(page) {
      if (this.isLoading) {
        return;
      }
      $('#the-alert').hide();
      $('.page').hide();
      return $(page).show();
    };

    App.prototype.redrawGameList = function() {
      var game, gameList, j, len, ref, results;
      gameList = $('#list-siftrs');
      gameList.text('');
      ref = this.games;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        game = ref[j];
        results.push((function(_this) {
          return function(game) {
            return appendTo(gameList, '.media', {}, function(media) {
              appendTo(media, '.media-left', {}, function(mediaLeft) {
                return appendTo(mediaLeft, '.media-object', {
                  style: "width: 64px;\nheight: 64px;\nbackground-image: url(" + game.icon_media.url + ");\nbackground-size: contain;\nbackground-repeat: no-repeat;\nbackground-position: center;"
                });
              });
              return appendTo(media, '.media-body', {}, function(mediaBody) {
                var markdown, ref1;
                appendTo(mediaBody, 'a', {
                  href: "" + SIFTR_URL + ((ref1 = game.siftr_url) != null ? ref1 : game.game_id),
                  target: '_blank'
                }, function(siftrLink) {
                  return appendTo(siftrLink, 'h4.media-heading', {
                    text: game.name
                  });
                });
                markdown = new Showdown.converter();
                appendTo(mediaBody, 'p', {
                  html: markdown.makeHtml(game.description)
                });
                return appendTo(mediaBody, 'form', {}, function(form) {
                  return appendTo(form, '.form-group', {}, function(formGroup) {
                    appendTo(formGroup, 'a.btn.btn-primary', {
                      href: '#edit' + game.game_id,
                      html: '<i class="fa fa-pencil"></i> Edit Siftr'
                    });
                    appendTo(formGroup, 'a.btn.btn-default', {
                      href: '#tags' + game.game_id,
                      html: '<i class="fa fa-tags"></i> Edit tags'
                    });
                    appendTo(formGroup, 'a.btn.btn-default', {
                      href: '#editors' + game.game_id,
                      html: '<i class="fa fa-users"></i> Editors'
                    });
                    return appendTo(formGroup, 'a.btn.btn-danger', {
                      html: '<i class="fa fa-remove"></i> Delete Siftr'
                    }, function(button) {
                      return button.click(function() {
                        $('#the-delete-title').text('Delete Siftr');
                        $('#the-delete-text').text("Are you sure you want to delete \"" + game.name + "\"?");
                        $('#the-delete-button').unbind('click');
                        $('#the-delete-button').click(function() {
                          return _this.deleteSiftr(game);
                        });
                        return $('#the-delete-modal').modal({
                          keyboard: true
                        });
                      });
                    });
                  });
                });
              });
            });
          };
        })(this)(game));
      }
      return results;
    };

    App.prototype.updateGameList = function(cb) {
      if (cb == null) {
        cb = (function() {});
      }
      this.games = [];
      if (this.aris.auth != null) {
        return this.getGames((function(_this) {
          return function() {
            return _this.getAllGameInfo(function() {
              _this.redrawGameList();
              return cb();
            });
          };
        })(this));
      } else {
        this.redrawGameList();
        return cb();
      }
    };

    App.prototype.addGameFromJson = function(json) {
      var game, i, j, len, newGame, ref;
      newGame = {
        game_id: parseInt(json.game_id),
        name: json.name,
        description: json.description,
        icon_media_id: parseInt(json.icon_media_id),
        map_latitude: parseFloat(json.map_latitude),
        map_longitude: parseFloat(json.map_longitude),
        map_zoom_level: parseInt(json.map_zoom_level),
        siftr_url: json.siftr_url || null,
        published: parseInt(json.published) ? true : false,
        moderated: parseInt(json.moderated) ? true : false
      };
      ref = this.games;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        game = ref[i];
        if (game.game_id === newGame.game_id) {
          this.games[i] = newGame;
          return newGame;
        }
      }
      this.games.push(newGame);
      return newGame;
    };

    App.prototype.getGames = function(cb) {
      if (cb == null) {
        cb = (function() {});
      }
      return this.aris.call('games.getGamesForUser', {}, (function(_this) {
        return function(arg) {
          var games, j, json, len;
          games = arg.data;
          _this.games = [];
          for (j = 0, len = games.length; j < len; j++) {
            json = games[j];
            if ((json.is_siftr != null) && !parseInt(json.is_siftr)) {
              continue;
            }
            _this.addGameFromJson(json);
          }
          return cb();
        };
      })(this));
    };

    App.prototype.getAllGameInfo = function(cb) {
      var actions;
      if (cb == null) {
        cb = (function() {});
      }
      actions = [
        ((function(_this) {
          return function(cb) {
            return _this.getGameIcons(cb);
          };
        })(this)), ((function(_this) {
          return function(cb) {
            return _this.getGameTags(function() {
              return _this.getGameTagCounts(cb);
            });
          };
        })(this)), ((function(_this) {
          return function(cb) {
            return _this.getGameEditors(cb);
          };
        })(this))
      ];
      return async.parallel(actions, cb);
    };

    App.prototype.getGameIcons = function(cb) {
      var game, go;
      if (cb == null) {
        cb = (function() {});
      }
      go = (function(_this) {
        return function(game) {
          return function(cb) {
            if (game.icon_media != null) {
              return cb();
            } else if (parseInt(game.icon_media_id) === 0) {
              game.icon_media = {
                url: 'img/uw_shield.png'
              };
              return cb();
            } else {
              return _this.aris.call('media.getMedia', {
                media_id: game.icon_media_id
              }, function(arg) {
                game.icon_media = arg.data;
                return cb();
              });
            }
          };
        };
      })(this);
      return async.parallel((function() {
        var j, len, ref, results;
        ref = this.games;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          game = ref[j];
          results.push(go(game));
        }
        return results;
      }).call(this), cb);
    };

    App.prototype.getGameTags = function(cb) {
      var game, go;
      if (cb == null) {
        cb = (function() {});
      }
      go = (function(_this) {
        return function(game) {
          return function(cb) {
            if (game.tags != null) {
              return cb();
            } else {
              return _this.aris.call('tags.getTagsForGame', {
                game_id: game.game_id
              }, function(arg) {
                game.tags = arg.data;
                return cb();
              });
            }
          };
        };
      })(this);
      return async.parallel((function() {
        var j, len, ref, results;
        ref = this.games;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          game = ref[j];
          results.push(go(game));
        }
        return results;
      }).call(this), cb);
    };

    App.prototype.getGameTagCounts = function(cb) {
      var allTags, game, go, ref, tag;
      if (cb == null) {
        cb = (function() {});
      }
      allTags = (ref = []).concat.apply(ref, (function() {
        var j, len, ref, results;
        ref = (function() {
          var l, len, ref, results1;
          ref = this.games;
          results1 = [];
          for (l = 0, len = ref.length; l < len; l++) {
            game = ref[l];
            results1.push(game.tags);
          }
          return results1;
        }).call(this);
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          tag = ref[j];
          results.push(tag);
        }
        return results;
      }).call(this));
      go = (function(_this) {
        return function(tag) {
          return function(cb) {
            if (tag.count != null) {
              return cb();
            } else {
              return _this.aris.call('tags.countObjectsWithTag', {
                object_type: 'NOTE',
                tag_id: tag.tag_id
              }, function(arg) {
                var count;
                count = arg.data.count;
                tag.count = parseInt(count);
                return cb();
              });
            }
          };
        };
      })(this);
      return async.parallel((function() {
        var j, len, results;
        results = [];
        for (j = 0, len = allTags.length; j < len; j++) {
          tag = allTags[j];
          results.push(go(tag));
        }
        return results;
      })(), cb);
    };

    App.prototype.getGameEditors = function(cb) {
      var game, go;
      if (cb == null) {
        cb = (function() {});
      }
      go = (function(_this) {
        return function(game) {
          return function(cb) {
            if (game.editors != null) {
              return cb();
            } else {
              return _this.aris.call('editors.getEditorsForGame', {
                game_id: game.game_id
              }, function(arg) {
                game.editors = arg.data;
                return cb();
              });
            }
          };
        };
      })(this);
      return async.parallel((function() {
        var j, len, ref, results;
        ref = this.games;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          game = ref[j];
          results.push(go(game));
        }
        return results;
      }).call(this), cb);
    };

    App.prototype.resetIcon = function() {
      $('#div-icon-input').fileinput('clear');
      $('#div-icon-thumb').html('');
      return appendTo($('#div-icon-thumb'), 'img', {
        src: this.currentGame.icon_media.url
      });
    };

    App.prototype.createMap = function(arg) {
      var lat, lng, zoom;
      lat = arg.lat, lng = arg.lng, zoom = arg.zoom;
      if (this.map != null) {
        this.map.setCenter({
          lat: lat,
          lng: lng
        });
        return this.map.setZoom(zoom);
      } else {
        return this.map = new google.maps.Map($('#the-map')[0], {
          center: {
            lat: lat,
            lng: lng
          },
          zoom: zoom
        });
      }
    };

    App.prototype.startEdit = function(game) {
      if (game == null) {
        game = this.currentGame;
      }
      this.currentGame = game;
      $('#text-siftr-name').val(game.name);
      $('#text-siftr-desc').val(game.description);
      $('#text-siftr-url').val(game.siftr_url);
      $('#checkbox-siftr-published').prop('checked', game.published);
      $('#checkbox-siftr-moderated').prop('checked', game.moderated);
      this.resetIcon();
      this.createMap({
        lat: game.map_latitude,
        lng: game.map_longitude,
        zoom: game.map_zoom_level
      });
      this.previewURL();
      return this.selectPage('#page-edit');
    };

    App.prototype.previewURL = function() {
      var url;
      url = SIFTR_URL + ($('#text-siftr-url').val() || this.currentGame.game_id);
      return $('#code-siftr-url-template').text(url);
    };

    App.prototype.uploadMediaFromInput = function(input, game, cb) {
      var reader;
      reader = new FileReader;
      reader.onload = (function(_this) {
        return function(e) {
          var base64, dataURL, ext, extmap, k, v;
          dataURL = e.target.result;
          extmap = {
            jpg: 'data:image/jpeg;base64,',
            png: 'data:image/png;base64,',
            gif: 'data:image/gif;base64,'
          };
          ext = null;
          base64 = null;
          for (k in extmap) {
            v = extmap[k];
            if (dataURL.indexOf(v) === 0) {
              ext = k;
              base64 = dataURL.substring(v.length);
            }
          }
          if ((ext != null) && (base64 != null)) {
            return _this.aris.call('media.createMedia', {
              game_id: game.game_id,
              file_name: "upload." + ext,
              data: base64
            }, cb);
          } else {
            return cb(false);
          }
        };
      })(this);
      return reader.readAsDataURL($(input)[0].files[0]);
    };

    App.prototype.getIconID = function(cb) {
      if (cb == null) {
        cb = (function() {});
      }
      if ($('#file-siftr-icon')[0].files.length === 0) {
        return cb(this.currentGame.icon_media_id);
      } else {
        return this.uploadMediaFromInput('#file-siftr-icon', this.currentGame, (function(_this) {
          return function(arg) {
            var media;
            media = arg.data;
            return cb(media.media_id);
          };
        })(this));
      }
    };

    App.prototype.editSave = function(cb) {
      var pn;
      if (cb == null) {
        cb = (function() {});
      }
      $('#spinner-edit-save').show();
      pn = this.map.getCenter();
      return this.getIconID((function(_this) {
        return function(media_id) {
          return _this.aris.call('games.updateGame', {
            game_id: _this.currentGame.game_id,
            name: $('#text-siftr-name').val(),
            description: $('#text-siftr-desc').val(),
            siftr_url: $('#text-siftr-url').val(),
            published: $('#checkbox-siftr-published').prop('checked') ? 1 : 0,
            moderated: $('#checkbox-siftr-moderated').prop('checked') ? 1 : 0,
            map_latitude: pn.lat(),
            map_longitude: pn.lng(),
            map_zoom_level: _this.map.getZoom(),
            icon_media_id: media_id
          }, function(arg) {
            var json, newGame, returnCode, returnCodeDescription;
            json = arg.data, returnCode = arg.returnCode, returnCodeDescription = arg.returnCodeDescription;
            if (returnCode !== 0) {
              _this.showAlert(returnCodeDescription);
              return $('#spinner-edit-save').hide();
            } else {
              newGame = _this.addGameFromJson(json);
              return _this.getAllGameInfo(function() {
                _this.redrawGameList();
                $('#spinner-edit-save').hide();
                window.location.hash = '#';
                return cb(newGame);
              });
            }
          });
        };
      })(this));
    };

    App.prototype.makeNewSiftr = function() {
      $('#spinner-new-siftr').show();
      return this.aris.call('games.createGame', {
        name: 'Your New Siftr',
        description: '',
        map_latitude: 43.071644,
        map_longitude: -89.400658,
        map_zoom_level: 14,
        is_siftr: 1,
        published: 0,
        moderated: 0
      }, (function(_this) {
        return function(arg) {
          var game;
          game = arg.data;
          _this.addGameFromJson(game);
          return _this.aris.call('tags.createTag', {
            game_id: game.game_id,
            tag: 'Your First Tag'
          }, function(arg1) {
            var tag;
            tag = arg1.data;
            return _this.getAllGameInfo(function() {
              _this.redrawGameList();
              $('#spinner-new-siftr').hide();
              return _this.showAlert('Your Siftr has been created! Click "Edit Siftr" to get started.', true);
            });
          });
        };
      })(this));
    };

    App.prototype.ableEditTags = function() {
      if ($('#div-edit-tags').children().length === 1) {
        $('.delete-tag').addClass('disabled');
      } else {
        $('.delete-tag').removeClass('disabled');
      }
      if ($('#div-edit-tags').children().length >= 8) {
        return $('#button-add-tag').addClass('disabled');
      } else {
        return $('#button-add-tag').removeClass('disabled');
      }
    };

    App.prototype.addTagEditor = function(tag) {
      appendTo($('#div-edit-tags'), '.media', {}, (function(_this) {
        return function(media) {
          appendTo(media, '.media-left', {}, function(mediaLeft) {
            return appendTo(mediaLeft, '.fileinput.fileinput-new', {
              'data-provides': 'fileinput'
            }, function(fileInput) {
              var thumb;
              thumb = appendTo(fileInput, '.fileinput-preview.thumbnail', {
                'data-trigger': 'fileinput',
                style: 'width: 64px; height: 64px;'
              }, function(thumb) {
                var ref, ref1;
                return appendTo(thumb, 'img', {
                  src: tag != null ? (ref = tag.media) != null ? (ref1 = ref.data) != null ? ref1.url : void 0 : void 0 : void 0
                });
              });
              return appendTo(fileInput, 'input.new-tag-icon', {
                type: 'file',
                name: '...',
                style: 'display: none;'
              }, function(iconInput) {
                return iconInput.change(function() {
                  thumb.addClass('icon-uploading');
                  return _this.uploadMediaFromInput(iconInput, _this.currentGame, function(arg) {
                    var media;
                    media = arg.data;
                    return _this.aris.call('tags.updateTag', {
                      tag_id: tag.tag_id,
                      media_id: media.media_id
                    }, function(arg1) {
                      var newTag;
                      newTag = arg1.data;
                      thumb.removeClass('icon-uploading');
                      tag.media = newTag.media;
                      return tag.media_id = newTag.media_id;
                    });
                  });
                });
              });
            });
          });
          return appendTo(media, '.media-body', {}, function(mediaBody) {
            return appendTo(mediaBody, 'form', {}, function(form) {
              appendTo(form, '.form-group.has-success', {}, function(formGroup) {
                return appendTo(formGroup, '.input-group', {}, function(inputGroup) {
                  var edited, input, lastEdited, lastUploaded, onEdit, saved, uploading;
                  lastEdited = Date.now();
                  lastUploaded = Date.now();
                  input = appendTo(inputGroup, 'input.form-control', {
                    type: 'text',
                    placeholder: 'Tag',
                    val: tag.tag
                  });
                  appendTo(inputGroup, 'span.input-group-addon', {
                    text: tag.count === 1 ? "1 note" : tag.count + " notes"
                  });
                  saved = edited = uploading = null;
                  appendTo(inputGroup, 'span.input-group-addon', {}, function(addon) {
                    saved = appendTo(addon, 'i.fa.fa-check');
                    edited = appendTo(addon, 'i.fa.fa-edit', {
                      style: 'display: none;'
                    });
                    return uploading = appendTo(addon, 'i.fa.fa-spinner.fa-pulse', {
                      style: 'display: none;'
                    });
                  });
                  onEdit = function() {
                    var thisEdited;
                    lastEdited = thisEdited = Date.now();
                    saved.hide();
                    edited.show();
                    uploading.hide();
                    formGroup.removeClass('has-success');
                    return setTimeout(function() {
                      var newValue, thisUploaded;
                      if (lastEdited === thisEdited) {
                        lastUploaded = thisUploaded = Date.now();
                        saved.hide();
                        edited.hide();
                        uploading.show();
                        newValue = input.val();
                        return _this.aris.call('tags.updateTag', {
                          tag_id: tag.tag_id,
                          tag: newValue
                        }, function() {
                          tag.tag = newValue;
                          if (lastUploaded === thisUploaded) {
                            if (lastEdited < thisUploaded) {
                              saved.show();
                              edited.hide();
                              uploading.hide();
                              return formGroup.addClass('has-success');
                            } else {

                            }
                          } else {

                          }
                        });
                      }
                    }, 500);
                  };
                  return input.keydown(onEdit);
                });
              });
              return appendTo(form, '.form-group', {}, function(formGroup) {
                return appendTo(formGroup, 'a.btn.btn-danger.delete-tag', {
                  html: '<i class="fa fa-remove"></i> Delete tag'
                }, function(btn) {
                  return btn.click(function() {
                    var dropdown, message;
                    if (tag.count === 0) {
                      $('#the-delete-title').text('Delete Tag');
                      message = "Are you sure you want to delete the tag \"" + tag.tag + "\"?";
                      $('#the-delete-text').text(message);
                      $('#the-delete-button').unbind('click');
                      $('#the-delete-button').click(function() {
                        return _this.deleteTag(tag);
                      });
                      return $('#the-delete-modal').modal({
                        keyboard: true
                      });
                    } else {
                      $('#the-delete-title').text('Delete Tag');
                      message = "Are you sure you want to delete the tag \"" + tag.tag + "\"?\n" + tag.count + " " + (tag.count === 1 ? 'note' : 'notes') + " will be reassigned to the tag chosen below:";
                      $('#the-delete-text').text('');
                      appendTo($('#the-delete-text'), 'p', {
                        text: message
                      });
                      dropdown = null;
                      appendTo($('#the-delete-text'), 'form', {}, function(form) {
                        return dropdown = appendTo(form, 'select.form-control', {}, function(select) {
                          var j, len, otherTag, ref, results;
                          ref = _this.currentGame.tags;
                          results = [];
                          for (j = 0, len = ref.length; j < len; j++) {
                            otherTag = ref[j];
                            if (tag.tag_id !== otherTag.tag_id) {
                              results.push(appendTo(select, 'option', {
                                text: otherTag.tag,
                                value: otherTag.tag_id
                              }));
                            } else {
                              results.push(void 0);
                            }
                          }
                          return results;
                        });
                      });
                      $('#the-delete-button').unbind('click');
                      $('#the-delete-button').click(function() {
                        return _this.deleteTag(tag, dropdown.val());
                      });
                      return $('#the-delete-modal').modal({
                        keyboard: true
                      });
                    }
                  });
                });
              });
            });
          });
        };
      })(this));
      return this.ableEditTags();
    };

    App.prototype.startEditTags = function(game) {
      var j, len, ref, tag;
      this.currentGame = game;
      $('#div-edit-tags').html('');
      ref = game.tags;
      for (j = 0, len = ref.length; j < len; j++) {
        tag = ref[j];
        this.addTagEditor(tag);
      }
      return this.selectPage('#page-edit-tags');
    };

    App.prototype.startEditors = function(game) {
      var j, len, ref, user;
      this.currentGame = game;
      $('#div-editor-list').html('');
      ref = game.editors;
      for (j = 0, len = ref.length; j < len; j++) {
        user = ref[j];
        this.addEditorListing(user);
      }
      return this.selectPage('#page-editors');
    };

    App.prototype.addEditorListing = function(user) {
      var canDelete;
      canDelete = this.currentGame.editors.length > 1 && parseInt(user.user_id) !== this.aris.auth.user_id;
      return appendTo($('#div-editor-list'), '.form-group', {}, (function(_this) {
        return function(formGroup) {
          return appendTo(formGroup, '.input-group', {}, function(inputGroup) {
            appendTo(inputGroup, 'input.form-control', {
              type: 'text',
              value: user.user_name,
              disabled: true
            });
            return appendTo(inputGroup, 'span.input-group-btn', {}, function(buttonSpan) {
              return appendTo(buttonSpan, 'button.btn.btn-danger', {
                disabled: !canDelete
              }, function(button) {
                appendTo(button, 'i.fa.fa-remove');
                return button.click(function() {
                  $('#the-delete-title').text('Delete Editor');
                  $('#the-delete-text').text("Are you sure you want to delete the editor \"" + user.user_name + "\"?");
                  $('#the-delete-button').unbind('click');
                  $('#the-delete-button').click(function() {
                    return _this.deleteEditor(user);
                  });
                  return $('#the-delete-modal').modal({
                    keyboard: true
                  });
                });
              });
            });
          });
        };
      })(this));
    };

    App.prototype.addEditor = function() {
      var username;
      username = $('#add-editor-username').val();
      $('#add-editor-username').val('');
      if (username === '') {
        return this.showAlert('Enter the username of the editor you want to add.');
      } else {
        return this.aris.call('users.getUserForSearch', {
          search: username
        }, (function(_this) {
          return function(res) {
            if (res.returnCode !== 0) {
              return _this.showAlert(res.returnCodeDescription);
            } else {
              return _this.aris.call('editors.addEditorToGame', {
                user_id: parseInt(res.data.user_id),
                game_id: _this.currentGame.game_id
              }, function(res) {
                if (res.returnCode !== 0) {
                  return _this.showAlert(res.returnCodeDescription);
                } else {
                  delete _this.currentGame.editors;
                  return _this.getAllGameInfo(function() {
                    return _this.startEditors(_this.currentGame);
                  });
                }
              });
            }
          };
        })(this));
      }
    };

    App.prototype.deleteEditor = function(user) {
      $('#the-delete-spinner').show();
      return this.aris.call('editors.removeEditorFromGame', {
        user_id: parseInt(user.user_id),
        game_id: this.currentGame.game_id
      }, (function(_this) {
        return function(res) {
          if (res.returnCode !== 0) {
            _this.showAlert(res.returnCodeDescription);
          } else {
            delete _this.currentGame.editors;
            _this.getAllGameInfo(function() {
              return _this.startEditors(_this.currentGame);
            });
          }
          $('#the-delete-modal').modal('hide');
          return $('#the-delete-spinner').hide();
        };
      })(this));
    };

    App.prototype.editAddTag = function() {
      $('#spinner-add-tag').show();
      return this.aris.call('tags.createTag', {
        game_id: this.currentGame.game_id
      }, (function(_this) {
        return function(res) {
          var tag;
          if (res.returnCode === 0) {
            tag = res.data;
            tag.count = 0;
            _this.currentGame.tags.push(tag);
            _this.addTagEditor(tag);
          } else {
            _this.showAlert(res.returnCodeDescription);
          }
          return $('#spinner-add-tag').hide();
        };
      })(this));
    };

    App.prototype.assignTag = function(note, newTagID) {
      return (function(_this) {
        return function(cb) {
          return _this.aris.call('tags.createObjectTag', {
            game_id: _this.currentGame.game_id,
            object_type: 'NOTE',
            object_id: note.note_id,
            tag_id: newTagID
          }, cb);
        };
      })(this);
    };

    App.prototype.deleteTag = function(tag, newTagID) {
      var proceed;
      if (newTagID == null) {
        newTagID = null;
      }
      proceed = (function(_this) {
        return function() {
          return _this.aris.call('tags.deleteTag', {
            tag_id: tag.tag_id
          }, function(res) {
            if (res.returnCode === 0) {
              delete _this.currentGame.tags;
              _this.getAllGameInfo(function() {
                return _this.startEditTags(_this.currentGame);
              });
            } else {
              _this.showAlert(res.returnCodeDescription);
            }
            $('#the-delete-modal').modal('hide');
            return $('#the-delete-spinner').hide();
          });
        };
      })(this);
      $('#the-delete-spinner').show();
      if (newTagID != null) {
        return this.aris.call('notes.searchNotes', {
          user_id: this.aris.auth.user_id,
          game_id: this.currentGame.game_id,
          tag_ids: [tag.tag_id]
        }, (function(_this) {
          return function(arg) {
            var note, notes;
            notes = arg.data;
            return async.parallel((function() {
              var j, len, results;
              results = [];
              for (j = 0, len = notes.length; j < len; j++) {
                note = notes[j];
                results.push(this.assignTag(note, newTagID));
              }
              return results;
            }).call(_this), proceed);
          };
        })(this));
      } else {
        return proceed();
      }
    };

    App.prototype.deleteSiftr = function(game) {
      $('#the-delete-spinner').show();
      return this.aris.call('games.deleteGame', {
        game_id: game.game_id
      }, (function(_this) {
        return function(res) {
          var g;
          if (res.returnCode === 0) {
            _this.games = (function() {
              var j, len, ref, results;
              ref = this.games;
              results = [];
              for (j = 0, len = ref.length; j < len; j++) {
                g = ref[j];
                if (g !== game) {
                  results.push(g);
                }
              }
              return results;
            }).call(_this);
            _this.redrawGameList();
            $('#the-alert').hide();
          } else {
            _this.showAlert(res.returnCodeDescription);
          }
          $('#the-delete-modal').modal('hide');
          return $('#the-delete-spinner').hide();
        };
      })(this));
    };

    return App;

  })();

  app = new App;

  window.app = app;

}).call(this);