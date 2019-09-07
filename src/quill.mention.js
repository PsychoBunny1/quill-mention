"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _quill = _interopRequireDefault(require("vue-quill-editor/node_modules/quill"));
var _keys = _interopRequireDefault(require("./constants/keys"));
require("./quill.mention.css");
require("./blots/mention");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return !!right[Symbol.hasInstance](left); } else { return left instanceof right; } }
function _classCallCheck(instance, Constructor) { if (!_instanceof(instance, Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
var numberIsNaN = require('./imports/numberisnan.js');
var Mention =
    /*#__PURE__*/
    function () {
        function Mention(quill, options) {
            _classCallCheck(this, Mention);
            this.isOpen = false;
            this.itemIndex = 0;
            this.mentionCharPos = null;
            this.cursorPos = null;
            this.values = [];
            this.suspendMouseEnter = false;
            this.quill = quill;
            this.options = {
                source: null,
                renderItem: function renderItem(item, searchTerm) {
                    return "".concat(item.value);
                },
                onSelect: function onSelect(item, insertItem) {
                    insertItem(item);
                },
                mentionDenotationChars: ['@'],
                showDenotationChar: true,
                allowedChars: /^[a-zA-Z0-9_]*$/,
                minChars: 0,
                maxChars: 31,
                offsetTop: 2,
                offsetLeft: 0,
                isolateCharacter: false,
                fixMentionsToQuill: false,
                defaultMenuOrientation: 'bottom',
                dataAttributes: ['id', 'value', 'denotationChar', 'link', 'target'],
                linkTarget: '_blank',
                onOpen: function onOpen() {
                    return true;
                },
                onClose: function onClose() {
                    return true;
                },
                // Style options
                listItemClass: 'ql-mention-list-item',
                mentionContainerClass: 'ql-mention-list-container',
                mentionListClass: 'ql-mention-list'
            };
            Object.assign(this.options, options, {
                dataAttributes: Array.isArray(options.dataAttributes) ? this.options.dataAttributes.concat(options.dataAttributes) : this.options.dataAttributes
            });
            this.mentionContainer = document.createElement('div');
            this.mentionContainer.className = this.options.mentionContainerClass ? this.options.mentionContainerClass : '';
            this.mentionContainer.style.cssText = 'display: none; position: absolute;';
            this.mentionContainer.onmousemove = this.onContainerMouseMove.bind(this);
            if (this.options.fixMentionsToQuill) {
                this.mentionContainer.style.width = 'auto';
            }
            this.mentionList = document.createElement('ul');
            this.mentionList.className = this.options.mentionListClass ? this.options.mentionListClass : '';
            this.mentionContainer.appendChild(this.mentionList);
            this.quill.container.appendChild(this.mentionContainer);
            quill.on('text-change', this.onTextChange.bind(this));
            quill.on('selection-change', this.onSelectionChange.bind(this));
            quill.keyboard.addBinding({
                key: _keys.default.TAB
            }, this.selectHandler.bind(this));
            quill.keyboard.bindings[9].unshift(quill.keyboard.bindings[9].pop());
            quill.keyboard.addBinding({
                key: _keys.default.ENTER
            }, this.selectHandler.bind(this));
            quill.keyboard.bindings[13].unshift(quill.keyboard.bindings[13].pop());
            quill.keyboard.addBinding({
                key: _keys.default.ESCAPE
            }, this.escapeHandler.bind(this));
            quill.keyboard.addBinding({
                key: _keys.default.UP
            }, this.upHandler.bind(this));
            quill.keyboard.addBinding({
                key: _keys.default.DOWN
            }, this.downHandler.bind(this));
        }
        _createClass(Mention, [{
            key: "selectHandler",
            value: function selectHandler() {
                if (this.isOpen) {
                    this.selectItem();
                    return false;
                }
                return true;
            }
        }, {
            key: "escapeHandler",
            value: function escapeHandler() {
                if (this.isOpen) {
                    this.hideMentionList();
                    return false;
                }
                return true;
            }
        }, {
            key: "upHandler",
            value: function upHandler() {
                if (this.isOpen) {
                    this.prevItem();
                    return false;
                }
                return true;
            }
        }, {
            key: "downHandler",
            value: function downHandler() {
                if (this.isOpen) {
                    this.nextItem();
                    return false;
                }
                return true;
            }
        }, {
            key: "showMentionList",
            value: function showMentionList() {
                this.mentionContainer.style.visibility = 'hidden';
                this.mentionContainer.style.display = '';
                this.setMentionContainerPosition();
                this.setIsOpen(true);
            }
        }, {
            key: "hideMentionList",
            value: function hideMentionList() {
                this.mentionContainer.style.display = 'none';
                this.setIsOpen(false);
            }
        }, {
            key: "highlightItem",
            value: function highlightItem() {
                var scrollItemInView = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
                for (var i = 0; i < this.mentionList.childNodes.length; i += 1) {
                    this.mentionList.childNodes[i].classList.remove('selected');
                }
                this.mentionList.childNodes[this.itemIndex].classList.add('selected');
                if (scrollItemInView) {
                    var itemHeight = this.mentionList.childNodes[this.itemIndex].offsetHeight;
                    var itemPos = this.itemIndex * itemHeight;
                    var containerTop = this.mentionContainer.scrollTop;
                    var containerBottom = containerTop + this.mentionContainer.offsetHeight;
                    if (itemPos < containerTop) {
                        // Scroll up if the item is above the top of the container
                        this.mentionContainer.scrollTop = itemPos;
                    } else if (itemPos > containerBottom - itemHeight) {
                        // scroll down if any part of the element is below the bottom of the container
                        this.mentionContainer.scrollTop += itemPos - containerBottom + itemHeight;
                    }
                }
            }
        }, {
            key: "getItemData",
            value: function getItemData() {
                var link = this.mentionList.childNodes[this.itemIndex].dataset.link;
                var hasLinkValue = typeof link !== 'undefined';
                var itemTarget = this.mentionList.childNodes[this.itemIndex].dataset.target;
                if (hasLinkValue) {
                    this.mentionList.childNodes[this.itemIndex].dataset.value = "<a href=\"".concat(link, "\" target=").concat(itemTarget || this.options.linkTarget, ">").concat(this.mentionList.childNodes[this.itemIndex].dataset.value);
                }
                return this.mentionList.childNodes[this.itemIndex].dataset;
            }
        }, {
            key: "onContainerMouseMove",
            value: function onContainerMouseMove() {
                this.suspendMouseEnter = false;
            }
        }, {
            key: "selectItem",
            value: function selectItem() {
                var _this = this;
                var data = this.getItemData();
                this.options.onSelect(data, function (asyncData) {
                    _this.insertItem(asyncData);
                });
                this.hideMentionList();
            }
        }, {
            key: "insertItem",
            value: function insertItem(data) {
                var render = data;
                if (render === null) {
                    return;
                }
                if (!this.options.showDenotationChar) {
                    render.denotationChar = '';
                }
                var prevMentionCharPos = this.mentionCharPos;
                this.quill.deleteText(this.mentionCharPos, this.cursorPos - this.mentionCharPos, _quill.default.sources.USER);
                this.quill.insertEmbed(prevMentionCharPos, 'mention', render, _quill.default.sources.USER);
                this.quill.insertText(prevMentionCharPos + 1, ' ', _quill.default.sources.USER);
                this.quill.setSelection(prevMentionCharPos + 2, _quill.default.sources.USER);
                this.hideMentionList();
            }
        }, {
            key: "onItemMouseEnter",
            value: function onItemMouseEnter(e) {
                if (this.suspendMouseEnter) {
                    return;
                }
                var index = Number(e.target.dataset.index);
                if (!numberIsNaN(index) && index !== this.itemIndex) {
                    this.itemIndex = index;
                    this.highlightItem(false);
                }
            }
        }, {
            key: "onItemClick",
            value: function onItemClick(e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                this.itemIndex = e.currentTarget.dataset.index;
                this.highlightItem();
                this.selectItem();
            }
        }, {
            key: "attachDataValues",
            value: function attachDataValues(element, data) {
                var _this2 = this;
                var mention = element;
                Object.keys(data).forEach(function (key) {
                    if (_this2.options.dataAttributes.indexOf(key) > -1) {
                        mention.dataset[key] = data[key];
                    } else {
                        delete mention.dataset[key];
                    }
                });
                return mention;
            }
        }, {
            key: "renderList",
            value: function renderList(mentionChar, data, searchTerm) {
                if (data && data.length > 0) {
                    this.values = data;
                    this.mentionList.innerHTML = '';
                    for (var i = 0; i < data.length; i += 1) {
                        var li = document.createElement('li');
                        li.className = this.options.listItemClass ? this.options.listItemClass : '';
                        li.dataset.index = i;
                        li.innerHTML = this.options.renderItem(data[i], searchTerm);
                        li.onmouseenter = this.onItemMouseEnter.bind(this);
                        li.dataset.denotationChar = mentionChar;
                        li.onclick = this.onItemClick.bind(this);
                        this.mentionList.appendChild(this.attachDataValues(li, data[i]));
                    }
                    this.itemIndex = 0;
                    this.highlightItem();
                    this.showMentionList();
                } else {
                    this.hideMentionList();
                }
            }
        }, {
            key: "nextItem",
            value: function nextItem() {
                this.itemIndex = (this.itemIndex + 1) % this.values.length;
                this.suspendMouseEnter = true;
                this.highlightItem();
            }
        }, {
            key: "prevItem",
            value: function prevItem() {
                this.itemIndex = (this.itemIndex + this.values.length - 1) % this.values.length;
                this.suspendMouseEnter = true;
                this.highlightItem();
            }
        }, {
            key: "hasValidChars",
            value: function hasValidChars(s) {
                return this.options.allowedChars.test(s);
            }
        }, {
            key: "containerBottomIsNotVisible",
            value: function containerBottomIsNotVisible(topPos, containerPos) {
                var mentionContainerBottom = topPos + this.mentionContainer.offsetHeight + containerPos.top;
                return mentionContainerBottom > window.pageYOffset + window.innerHeight;
            }
        }, {
            key: "containerRightIsNotVisible",
            value: function containerRightIsNotVisible(leftPos, containerPos) {
                if (this.options.fixMentionsToQuill) {
                    return false;
                }
                var rightPos = leftPos + this.mentionContainer.offsetWidth + containerPos.left;
                var browserWidth = window.pageXOffset + document.documentElement.clientWidth;
                return rightPos > browserWidth;
            }
        }, {
            key: "setIsOpen",
            value: function setIsOpen(isOpen) {
                if (this.isOpen !== isOpen) {
                    if (isOpen) {
                        this.options.onOpen();
                    } else {
                        this.options.onClose();
                    }
                    this.isOpen = isOpen;
                }
            }
        }, {
            key: "setMentionContainerPosition",
            value: function setMentionContainerPosition() {
                var containerPos = this.quill.container.getBoundingClientRect();
                var mentionCharPos = this.quill.getBounds(this.mentionCharPos);
                var containerHeight = this.mentionContainer.offsetHeight;
                var topPos = this.options.offsetTop;
                var leftPos = this.options.offsetLeft; // handle horizontal positioning
                if (this.options.fixMentionsToQuill) {
                    var rightPos = 0;
                    this.mentionContainer.style.right = "".concat(rightPos, "px");
                } else {
                    leftPos += mentionCharPos.left;
                }
                if (this.containerRightIsNotVisible(leftPos, containerPos)) {
                    var containerWidth = this.mentionContainer.offsetWidth + this.options.offsetLeft;
                    var quillWidth = containerPos.width;
                    leftPos = quillWidth - containerWidth;
                } // handle vertical positioning
                if (this.options.defaultMenuOrientation === 'top') {
                    // Attempt to align the mention container with the top of the quill editor
                    if (this.options.fixMentionsToQuill) {
                        topPos = -1 * (containerHeight + this.options.offsetTop);
                    } else {
                        topPos = mentionCharPos.top - (containerHeight + this.options.offsetTop);
                    } // default to bottom if the top is not visible
                    if (topPos + containerPos.top <= 0) {
                        var overMentionCharPos = this.options.offsetTop;
                        if (this.options.fixMentionsToQuill) {
                            overMentionCharPos += containerPos.height;
                        } else {
                            overMentionCharPos += mentionCharPos.bottom;
                        }
                        topPos = overMentionCharPos;
                    }
                } else {
                    // Attempt to align the mention container with the bottom of the quill editor
                    if (this.options.fixMentionsToQuill) {
                        topPos += containerPos.height;
                    } else {
                        topPos += mentionCharPos.bottom;
                    } // default to the top if the bottom is not visible
                    if (this.containerBottomIsNotVisible(topPos, containerPos)) {
                        var _overMentionCharPos = this.options.offsetTop * -1;
                        if (!this.options.fixMentionsToQuill) {
                            _overMentionCharPos += mentionCharPos.top;
                        }
                        topPos = _overMentionCharPos - containerHeight;
                    }
                }
                this.mentionContainer.style.top = "".concat(topPos, "px");
                this.mentionContainer.style.left = "".concat(leftPos, "px");
                this.mentionContainer.style.visibility = 'visible';
            }
        }, {
            key: "onSomethingChange",
            value: function onSomethingChange() {
                var range = this.quill.getSelection();
                if (range == null) return;
                this.cursorPos = range.index;
                var startPos = Math.max(0, this.cursorPos - this.options.maxChars);
                var beforeCursorPos = this.quill.getText(startPos, this.cursorPos - startPos);
                var mentionCharIndex = this.options.mentionDenotationChars.reduce(function (prev, cur) {
                    var previousIndex = prev;
                    var mentionIndex = beforeCursorPos.lastIndexOf(cur);
                    return mentionIndex > previousIndex ? mentionIndex : previousIndex;
                }, -1);
                if (mentionCharIndex > -1) {
                    if (this.options.isolateCharacter && !(mentionCharIndex === 0 || !!beforeCursorPos[mentionCharIndex - 1].match(/\s/g))) {
                        this.hideMentionList();
                        return;
                    }
                    var mentionCharPos = this.cursorPos - (beforeCursorPos.length - mentionCharIndex);
                    this.mentionCharPos = mentionCharPos;
                    var textAfter = beforeCursorPos.substring(mentionCharIndex + 1);
                    if (textAfter.length >= this.options.minChars && this.hasValidChars(textAfter)) {
                        var mentionChar = beforeCursorPos[mentionCharIndex];
                        this.options.source(textAfter, this.renderList.bind(this, mentionChar), mentionChar);
                    } else {
                        this.hideMentionList();
                    }
                } else {
                    this.hideMentionList();
                }
            }
        }, {
            key: "onTextChange",
            value: function onTextChange(delta, oldDelta, source) {
                if (source === 'user') {
                    this.onSomethingChange();
                }
            }
        }, {
            key: "onSelectionChange",
            value: function onSelectionChange(range) {
                if (range && range.length === 0) {
                    this.onSomethingChange();
                } else {
                    this.hideMentionList();
                }
            }
        }]);
        return Mention;
    }();
_quill.default.register('modules/mention', Mention);
var _default = Mention;
exports.default = _default;
