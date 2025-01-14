/**
 * Менеджер редактора xml.
 *
 * @author dew1983@mail.ru <Suvorov Andrey M.>
 */
 
Ext.define(
    'FBEditor.view.panel.main.xml.Manager',
    {
        requires: [
            'FBEditor.view.panel.main.xml.proxy.Editor'
        ],

        statics: {
            /**
             * Возвращает менеджер.
             * @property {FBEditor.view.panel.main.xml.Manager}
             */
            getInstance: function ()
            {
                return FBEditor.view.panel.main.xml.Manager.self;
            },

            /**
             * @private
             * @property {FBEditor.view.panel.main.xml.Manager}
             */
            self: null
        },

        /**
         * @private
         * @property {FBEditor.view.panel.main.editor.Manager} Менеджер редактора текста.
         */
        managerEditor: null,

        /**
         * @private
         * @property {FBEditor.view.panel.main.xml.proxy.Editor} Прокси для работы со сторонним редактором xml.
         */
        proxyEditor: null,

        /**
         * @private
         * @property {FBEditor.view.panel.main.xml.Xml} Панель редактора xml.
         */
        panel: null,

        /**
         * @private
         * @property {FBEditor.editor.element.AbstractElement} Текущий редактируемый элемент в редакторе xml.
         */
        el: null,

        /**
         * @private
         * @property {String} Хранит исходный xml, который был передан редактору.
         */
        srcXml: null,

        /**
         * @private
         * @property {FBEditor.view.panel.main.xml.search.Search} Панель поиска по xml.
         */
        searchPanel: null,
	
	    /**
         * @private
         * @property {Object} Позиция курсора.
	     * @property {Number} Object.line Номер строки.
	     * @property {Number} Object.ch Номер колонки.
	     */
	    posCursor: null,
	
	    /**
	     * @private
	     * @property {Boolean} Активен ли процесс синхронизации xml с текстом.
	     */
	    syncProcess: false,

        translateText: {
            invalidXml: 'Невалидный XML',
            invalidXmlMsg: 'Покинуть редактор XML без сохранения всех изменений?',
	        invalidXmlMsg2: 'Перейти к редактированию другого элемента без сохранения всех изменений в текущем?'
        },

        /**
         * @param {FBEditor.view.panel.main.editor.Editor} managerEditor Менеджер редактора текста.
         */
        constructor: function (managerEditor)
        {
            var me = this;

            // сохраняем ссылку в статической переменной для последующего обращения к менеджеру через #getInstance
            FBEditor.view.panel.main.xml.Manager.self = me;

            me.managerEditor = managerEditor;

            // прокси для работы со сторонним редактором xml
            me.proxyEditor = Ext.create('FBEditor.view.panel.main.xml.proxy.Editor');
        },

        /**
         * Возврщает менеджер редактора текста.
         * @return {FBEditor.view.panel.main.editor.Manager}
         */
        getManagerEditor: function ()
        {
            return this.managerEditor;
        },

        /**
         * Возвращает прокси для работы со сторонним редактором xml.
         * @return {FBEditor.view.panel.main.xml.proxy.Editor}
         */
        getProxyEditor: function ()
        {
            return this.proxyEditor;
        },

        /**
         * Возвращает ткущий редактируемый элемент.
         * @return {FBEditor.editor.element.AbstractElement}
         */
        getElement: function ()
        {
            return this.el;
        },

        /**
         * Устанавливает исходный xml, который передается в редактор.
         * @param {String} xml
         */
        setSrcXml: function (xml)
        {
            this.srcXml = xml;
        },

        /**
         * Загружает данные в редактор xml.
         * @param {FBEditor.editor.element.AbstractElement} [el] Элемент.
         */
        loadData: function (el)
        {
            var me = this,
                managerEditor = me.getManagerEditor(),
                content = managerEditor.getContent(),
                panel = me.getPanel(),
                xml;

            el = el || content;
            me.el = el;

            // получаем xml
            xml = el.getXml();
            
            // загружаем в панель
            panel.fireEvent('loadData', xml);
        },

        /**
         * Проверяет и синхронизирует xml с текстом.
         * @resolve {Boolean} true - синхронизация успешна.
         * @param {Boolean} isXmlPanel Проходит ли синхронизация в панели XML или произошло переключение
         * на другую панель.
         * @return {Promise}
         */
        sync: function (isXmlPanel)
        {
            var me = this,
                promise;

            promise = new Promise(
                function (resolve, reject)
                {
                    var proxy = me.getProxyEditor(),
                        managerEditor = me.getManagerEditor(),
                        el = me.getElement(),
                        srcXml = me.srcXml,
                        content,
                        scopeData,
                        schema,
                        root,
                        xml;
                    
                    if (!el || !srcXml)
                    {
                    	resolve(true);
                    	return;
                    }
                    
                    // устанавливаем флаг процесса синхронизации
                    me.setSyncProcess(true);

                    // получаем текущий xml из редактора
                    xml = proxy.getData();
                    
                    if (xml !== srcXml)
                    {
                        // xml изменился

                        // временно устанавливаем xml элемента
                        el.setXml(xml);

                        // получаем xml всего тела книги с учетом xml измененного элемента
                        root = managerEditor.getContent();
                        xml = root.getXml();

                        // удаляем временный xml элемента
                        el.setXml(null);

                        try
                        {
                            xml = '<?xml version="1.0" encoding="UTF-8"?>' + xml;

                            scopeData = {
                                resolve: resolve,
                                fullXml: xml,
	                            isXmlPanel: isXmlPanel
                            };
	
	                        // получаем модель для измененного xml
                            content = managerEditor.getModelFromXml(xml);
                            scopeData.content = content;
	
	                        // получаем xml новой модели для проверки по схеме
                            xml = content.getXml(true);

                            schema = managerEditor.getSchema();

                            // проверяем по схеме
                            schema.validXml(
                                {
                                    xml: xml,
                                    callback: me.verifyResult,
                                    scope: me,
                                    scopeData: scopeData
                                }
                            );
                        }
                        catch (e)
                        {
                            me.errorValidMessage(e, resolve, isXmlPanel);
                        }
                    }
                    else
                    {
	                    me.setSyncProcess(false);
                        resolve(true);
                    }
                }
            );

            return promise;
        },
	
	    /**
	     * Устанавливает флаг процесса синхронизации xml с текстом.
	     * @param {Boolean} sync true - процесс синхронизации активен.
	     */
	    setSyncProcess: function (sync)
	    {
	    	this.syncProcess = sync;
	    },
	
	    /**
	     * Активен ли процесс синхронизации.
	     * @return {Boolean}
	     */
	    isSyncProcess: function ()
	    {
	    	return this.syncProcess;
	    },

        /**
         * Обновляет дерево навигации по xml.
         */
        updateTree: function ()
        {
            var me = this,
                managerEditor = me.getManagerEditor(),
                data = managerEditor.getContent(),
                panel = me.getPanelNavigation();

            panel.loadData(data);
        },

        /**
         * Возвращает панель редактора xml.
         * @return {FBEditor.view.panel.main.xml.Xml}
         */
        getPanel: function ()
        {
            var me = this;

            me.panel = me.panel || Ext.getCmp('main-xml');

            return me.panel;
        },

        /**
         * Возвращает дерево навигации.
         * @return {FBEditor.view.panel.treenavigation.xml.Tree}
         */
        getPanelNavigation: function ()
        {
            var me = this,
                bridge = FBEditor.getBridgeNavigation(),
                panel;

            panel = bridge.Ext && bridge.Ext.getCmp && bridge.Ext.getCmp('panel-xml-navigation') ?
                bridge.Ext.getCmp('panel-xml-navigation') : null;

            return panel;
        },

        /**
         * Включает/отключает перенос длинных строк.
         * @param {Boolean} wrap true - включить перенос.
         */
        lineWrap: function (wrap)
        {
            var me = this,
                proxy = me.getProxyEditor();

            // устанавливаем перенос
            proxy.setLineWrap(wrap);
        },

        /**
         * Выполняет поиск по тексту.
         * @param {Object} [data] Данные поиска. Если данные не переданы, то убираем подсветку текущего поиска.
         * @param {String} data.searchText Строка поиска.
         * @param {Boolean} [data.isReg] Регулярное ли выражение в строке поиска.
         * @param {Boolean} [data.ignoreCase] Игнорировать ли регистр символов.
         * @param {Boolean} [data.words] Поиск целых слов.
         * @return {Number} Количество найденных совпадений.
         */
        runSearch: function (data)
        {
            var me = this,
                proxy = me.getProxyEditor(),
                count = 0,
                query,
                ignoreCase,
                isReg,
                words,
                search;

	        // прокси поиска
	        search = proxy.getSearch();
	        
	        if (data)
            {
	            query = data.searchText;
	            isReg = data.isReg;
	            ignoreCase = data.ignoreCase;
	            words = data.words;
	
	            // выполняем поиск
	            count = search.find(query, isReg, ignoreCase, words);
            }
            else
            {
                // убираем подсветку
                search.removeOverlay();
            }
            
            return count;
        },
	
	    /**
	     * Выполняет замену.
	     * @param {String} replaceStr Строка замены.
	     * @param {Boolean} [all] Заменить ли все совпадения.
	     * @return {Number} Количество оставшихся совпадений.
	     */
	    runReplace: function (replaceStr, all)
	    {
		    var me = this,
			    proxy = me.getProxyEditor(),
			    count,
			    search;
		
		    // прокси поиска
		    search = proxy.getSearch();
		
		    if (all)
		    {
			    // заменяем все совпадения
			    if (search.replaceAll(replaceStr))
			    {
				    count = 0;
			    }
		    }
		    else
		    {
			    // заменяем текущее совпадение
			    count = search.replace(replaceStr);
		    }
		
		    return count;
	    },
	
	    /**
         * Переводит курсор к следующему результату поиска.
	     */
	    findNext: function ()
        {
	        var me = this,
		        proxy = me.getProxyEditor(),
		        search;
	
	        // прокси поиска
	        search = proxy.getSearch();
	        
	        search.findNext();
        },
	
	    /**
	     * Переводит курсор к предыдущему результату поиска.
	     */
	    findPrev: function ()
	    {
		    var me = this,
			    proxy = me.getProxyEditor(),
			    search;
		
		    // прокси поиска
		    search = proxy.getSearch();
		
		    search.findPrev();
	    },

        /**
         * Вызывает панель поиска по тексту.
         * @param {Object} [lib] Внешний редактор xml.
         */
        doSearch: function (lib)
        {
            var me = lib ? lib.getManager() : this,
                panel,
	            replacePanel;

            panel = me.getSearchPanel();
            
            if (panel.isHidden())
            {
                panel.show();
            }
	
	        // ставим фокус в поле поиска
	        panel.setFocusSearchField();
	
	        replacePanel = panel.getReplacePanel();
	        replacePanel.hide();
        },

        /**
         * Вызывает панель замены по тексту.
         * @param {Object} [lib] Внешний редактор xml.
         */
        doReplace: function (lib)
        {
	        var me = lib ? lib.getManager() : this,
		        panel,
                replacePanel;
	
	        panel = me.getSearchPanel();
	
	        if (panel.isHidden())
	        {
		        panel.show();
	        }
	
	        // ставим фокус в поле поиска
	        panel.setFocusSearchField();
	
	        // показываем панель замены
	        replacePanel = panel.getReplacePanel();
	        replacePanel.show();
        },

        /**
         * Закрывает панель поиска.
         * @param {Object} [lib] Внешний редактор xml.
         */
        doEsc: function (lib)
        {
            var me = lib ? lib.getManager() : this,
                proxy = me.getProxyEditor(),
                panel;

            panel = me.getSearchPanel();

            if (!panel.isHidden())
            {
                // скрываем панель поиска
                panel.hide();
                
                // восстанавливаем фокус
                proxy.focus();
            }
        },

        /**
         * Возвращает панель поиска по xml.
         * @return {FBEditor.view.panel.main.xml.search.Search}
         */
        getSearchPanel: function ()
        {
            var me = this,
                panel = me.getPanel(),
                searchPanel;

            searchPanel = panel.getSearchPanel();

            return searchPanel;
        },

        /**
         * @private
         * Результат проверки xml.
         * @param {Boolean} res true - xml валиден.
         * @param {Object} resData Данные.
         * @param {Function} resData.resolve Колбэк.
         * @param {Object} resData.response Дополнительные данные проверки xml.
         * @param {Boolean} resData.isXmlPanel Проходит ли синхронизация в панели XML (true) или произошло переключение
         * на другую панель (false).
         */
        verifyResult: function (res, resData)
        {
            var me = this,
                response = resData.response,
                managerEditor = me.getManagerEditor(),
                e;

            //console.log('verifyResult', res, resData);
            //console.log(response.xml);

            try
            {
                if (!res)
                {
                    e = new Error();
                    e.error = response.valid;

                    me.errorValidMessage(e, resData.resolve, resData.isXmlPanel);
                }
                else
                {
                    // устанавливаем новый xml
                    managerEditor.setXml(resData.fullXml);
	
	                // устанавливаем новый контент
	                managerEditor.updateContent(resData.content);
	
	                managerEditor.updateTree();
	
	                me.setSyncProcess(false);
	                
                    resData.resolve(resData.content);
                }
            }
            catch (e)
            {
                me.errorValidMessage(e, resData.resolve);
            }
        },

        /**
         * @private
         * показывает сообщение об ошибке валидации XML.
         * @param {Error} e Объект ошибки.
         * @param {String} e.error Отредактированное сообщение об ошибке.
         * @param {Function} resolve Колбэк.
         * @param {Boolean} isXmlPanel Проходит ли синхронизация в панели XML или произошло переключение
         * на другую панель.
         */
        errorValidMessage: function (e, resolve, isXmlPanel)
        {
            var me = this,
                tt = me.translateText,
	            line,
                errMsg;
	
	        me.setSyncProcess(false);
	
	        errMsg = e.error;
	        line = errMsg;
            errMsg = Ext.String.htmlEncode(errMsg);
            errMsg = errMsg.replace(/\^/g, '');
            errMsg = errMsg.replace(/\n+/g, '<br/>');
            errMsg += '<br/>';
	        errMsg += isXmlPanel ? tt.invalidXmlMsg2 : tt.invalidXmlMsg;

            Ext.Msg.show(
                {
                    title: tt.invalidXml,
                    message: errMsg,
                    buttons: Ext.Msg.OKCANCEL,
                    icon: Ext.MessageBox.WARNING,
                    fn: function (btn)
                    {
                        var BTN_OK = 'ok';

                        if (btn === BTN_OK)
                        {
                            resolve(true);
                        }
                        else
                        {
                        	// перемещаем курсор к месту ошибки
                        	me.toErrorLine(line);
                        }
                    }
                }
            );
        },
	
	    /**
	     * @private
	     * Перемещает курсор к месту ошибки.
	     * @param {String} text Исходный текст ошибки, в котором содержится номер первой ошибочной строки.
	     */
	    toErrorLine: function (text)
	    {
	    	var me = this,
			    proxy = me.getProxyEditor(),
			    str,
			    line,
		        diff;
	    	
		    line = text.match(/error on line ([0-9]+)/);
		    
		    // корректировка номера строки в зависимости от сообщения
		    diff = line ? 3 : 2;
		    
		    line = line || text.match(/body\.xml:([0-9]+)/);
		    
		    if (line)
		    {
		    	line = Number(line[1]);
		    	line = line - diff;
		    	
		    	// текст строки
		    	str = proxy.getLine(line);
		    	
		    	// возвращаем фокус в редактор xml
		    	proxy.focus();
		    	
		    	// выделяем строку
			    proxy.setSelection({line: line, ch: 0}, {line: line, ch: str.length});
		    }
	    }
    }
);