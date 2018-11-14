class HtmlEditorField extends FormField {
    constructor(parentNode, key, attr, initialValue, colW) {
        super(parentNode, key, attr, initialValue, colW);

        this.editor = null;
        this.showingRaw = false;

        this.defaultToolbarHandlers = {
            'image': (value) => {
                const Emitter = this.editor.emitter.constructor;
                const Delta = this.editor.editor.getDelta().constructor;
                console.log('Delta', Delta);
                RBForm.getFieldType('asset').showDirectorySelect(this.attr, (asset) => {
                    console.log('ASSET: ', asset);
                    let range = this.editor.getSelection(true);
                    let delta = new Delta()
                        .retain(range.index)
                        .delete(range.length)
                        .insert({ image: asset.downloadLink });
                    this.editor.updateContents(delta, Emitter.sources.USER);
                });
            }
        }

        loadQuill();
    }

    renderLabel(value) {
        var self = this;
        var children = [this.label(value)];
        if (this.attr.rawEditor) {
            children.push(h('a.switch-link', {
                on: {
                    click: (e) => {
                        this.showingRaw = !this.showingRaw;
                        $(this.editorElm).parent().find('.ql-toolbar').children().css({visibility: this.showingRaw ? 'hidden' : 'visible'});
                        this.getRootForm().updateView();
                    }
                },
                style: {
                    marginLeft: '8px',
                    fontSize: '0.8em',
                    color: '#ccc',
                },
            }, [this.showingRaw ? 'Show Editor' : 'Show Raw HTML' ]));
        }

        return h('label', {
            props: {
                "for": "f_" + this.key,
            }
        }, children);
    }

    renderInput(value) {
        var self = this;
        return h('div', [
            h('div.editor-container', {
                attrs: {
                    // 'allowhtml': 'true',
                    // 'name': this.formName(),
                    // id: 'f_' + this.key,
                    // disabled: !this.isMutable(),
                },
                style: {
                    display: this.showingRaw ? 'none' : 'block',
                },
                hook: {
                    insert: (vnode) => {
                        self.editorElm = vnode.elm;
                        vnode.elm.innerHTML = value;
                        setTimeout(() => {
                            var editor = new Quill(vnode.elm, {
                                modules: { toolbar: HtmlEditorField.defaultToolbarOptions },
                                theme: 'snow'
                            });

                            this.editor = editor;

                            var field = $(this.editor.root);
                            // field.attr('name', this.formName());
                            field.attr('id', 'f_'+this.key);
                            // field.addClass('editable');
                            field.attr('allowhtml', true);
                            field.attr('disabled', !this.isMutable());

                            editor.on('text-change', function(newContents, oldContents, source) {
                                // var delta = editor.getContents();
                                if (source == 'user') {
                                    var html = field.html();
                                    console.log('UPDATE:', html);
                                    self.sendValueUpdate(html);
                                    this.emit('change', value);

                                    $(self.rawEditorElm).val(html);
                                }
                            });

                            var toolbar = this.editor.getModule('toolbar');
                            Object.keys(this.defaultToolbarHandlers).forEach((key) => {
                                toolbar.addHandler(key, this.defaultToolbarHandlers[key]);
                            });


                        }, 1000);

                    }
                }
            }),
            h('textarea.editor-textarea', {
                props: {
                    id: 'f_'+this.key,
                    // type: 'checkbox',
                    disabled: !this.isMutable(),
                },
                attrs: {
                    // contenteditable: true,
                    name: this.formName(),
                },
                style: {
                    display: this.showingRaw ? 'block' : 'none',
                },
                on: {
                    input: function (e) {
                        var delta = self.editor.clipboard.convert(e.target.value)
                        self.editor.setContents(delta);
                        console.log('setting text', e.target.value, delta);
                    }
                },
                hook: {
                    insert: (vnode) => {
                        this.rawEditorElm = vnode.elm;
                    }
                }
            }, [value || ''])
        ])

    }


}

HtmlEditorField.defaultToolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],

    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    //   [{ 'font': [] }],
    [{ 'align': [] }],

    ['clean']                                         // remove formatting button
];

// HtmlEditorField.

let quillLoading = false;
let style2Text = `
    .editor-container .editable {
        margin-bottom: 0;
        border-bottom-width: 0;
    }
    .editor-container .editable:hover {
        margin-bottom: 0;
        border-bottom-width: 0;
    }
    .editor-container .editable:focus {
        margin-bottom: 0;
        border-bottom-width: 0;
    }

    .editor-container .ql-editor p,
    .editor-container .ql-editor blockquote {
        margin-bottom: 1rem;
    }

    .editor-container {
        height: 375px;
        color: #333;
        /*overflow-y: scroll;*/
    }

    .editor-textarea {
        height: 375px;
        padding: 12px 15px;
        tab-size: 4;
        border: 1px solid #ccc;
        border-top-width: 0;
        outline: none;
        width: 100%;
        box-sizing: border-box;
        resize: none;
    }

    .editor-textarea:focus {
        border: 1px solid #ccc;
        border-top-width: 0;
    }

    .switch-link {
        cursor: pointer;
    }
`;

function loadQuill() {
    if (!quillLoading) {
        quillLoading = true;
        var scriptEl = document.createElement('script');
        scriptEl.src = '//cdn.quilljs.com/1.2.0/quill.js';
        document.body.appendChild(scriptEl);

        var styleEl = document.createElement('link');
        styleEl.rel = 'stylesheet';
        styleEl.href = '//cdn.quilljs.com/1.2.0/quill.snow.css';
        document.body.appendChild(styleEl);

        var styleEl2 = document.createElement('style');
        styleEl2.innerText = style2Text;
        document.body.appendChild(styleEl2);
    }
}

RBForm.registerFieldType('text:html', HtmlEditorField);
