(function () {
    if (window.pwa) {
        pwaParser()
    } else {
        window.addEventListener('load', pwaParser)
    }
    
    function pwaParser() {
        if (!window.pwa) {
            console.log('[PWA]: pwa parser seetings is not defined')
            return
        }

        if (!window.pwa.vars) {
            console.log('[PWA]: pwa parse vars is not defined')
            return
        }

        const vars = window.pwa.vars
        const html = document.querySelector('html')
        let open_re = '{{'
        let close_re = '}}'

        if (window.pwa && window.pwa.parser && window.pwa.parser.delimiters) {
            open_re = window.pwa.parser.delimiters[0]
            close_re = window.pwa.parser.delimiters[1]
        }

        const re = new RegExp('(' + open_re + ')' + '((?:.|\\n)+?)' + '(' + close_re + ')', 'g')
        //re = /({{)((?:.|\\n)+?)(}})/g;

        function DOMComb(parent_node, cb) {
            if (parent_node.hasChildNodes()) {
                for (var oNode = parent_node.firstChild; oNode; oNode = oNode.nextSibling) {
                    DOMComb(oNode, cb);
                }
            }

            cb.call(parent_node);
        }

        DOMComb(html, nodeHandler);

        function nodeHandler() {
            const node = this

            if (node.tagName) {
                if (node.hasAttributes()) {
                    const attributes = node.attributes

                    for (const key in attributes) {
                        if (attributes.hasOwnProperty(key)) {
                            findVar(node.attributes[key].nodeValue, function(var_name, var_value) {
                                node.attributes[key].nodeValue = node.attributes[key].nodeValue.replace(var_name, var_value)
                            })
                        }
                    }
                }
                
                if (node.innerHTML) {
                    findVar(node.textContent, function(var_name, var_value) {
                        node.innerHTML = node.innerHTML.replace(var_name, var_value)
                    })
                }
            }
        }

        function findVar(value, cb) {
            const matches_arrs = []

            while ((matches = re.exec(value)) !== null) {
                matches_arrs.push(matches)
            }

            for (let index = 0; index < matches_arrs.length; index++) {
                const matches = matches_arrs[index];

                if (matches instanceof Array && matches.length >= 2) {
                    const key = matches[2].trim()

                    if (vars.hasOwnProperty(key)) {
                        cb(matches[0], vars[key])
                    }                    
                }
            }
        }
    }
})();