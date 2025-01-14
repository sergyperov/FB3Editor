/**
 * Загрузчик тела с хаба.
 *
 * @author dew1983@mail.ru <Suvorov Andrey M.>
 */

Ext.define(
	'FBEditor.view.panel.main.editor.Loader',
	{
		extend : 'FBEditor.loader.Loader',

		loadAction: 'https://hub.litres.ru/pages/get_fb3_body/',

		/**
		 * Инициализирует адреса загрузки и сохранения.
		 */
		constructor: function ()
		{
			var me = this,
				routeManager = FBEditor.route.Manager,
				art;

			me.callParent(arguments);
			art = routeManager.getParam('body_art');

			if (art)
			{
				me.setArt(art);
			}
		},

		/**
		 * Загружает тело.
		 * @param {Number} [art] Айди произведениея на хабе.
		 * @return {Promise}
		 */
		load: function (art)
		{
			var me = this,
				promise;

			if (art)
			{
				// устанавливаем айди произведения
				me.setArt(art);
			}

			promise = new Promise(
				function (resolve, reject)
				{
					me.getLoadUrl().then(
						function (url)
						{
							Ext.log({level: 'info', msg: 'Загрузка тела книги из ' + url});

							Ext.Ajax.request(
								{
									url: url,
									scope: this,
									success: function(response)
									{
										if (response && response.responseText && /^<\?xml/ig.test(response.responseText))
										{
											resolve(response.responseText);
										}
										else
										{
											reject(response);
										}
									},
									failure: function (response)
									{
										reject(response);
									}
								}
							);
						}
					);
				}
			);

			return promise;
		},

		/**
		 * Загружает дифф с хаба для текущей ревизии.
		 * @param {Number} rev Номер текущей ревизии.
		 * @return {Promise}
		 */
		loadDiff: function (rev)
		{
			var me = this,
				promise;
			
			promise = new Promise(
				function (resolve, reject)
				{
					me.getLoadUrl({rev: rev}).then(
						function (url)
						{
							Ext.log({level: 'info', msg: 'Загрузка дифф тела книги из ' + url});

							Ext.Ajax.request(
								{
									url: url,
									success: function (response)
									{
										var diff,
											rev;

										if (response && response.responseText &&
										    /^<\!--|Index/ig.test(response.responseText))
										{
											diff = response.responseText;
											rev = diff.match(/rev (\d+) -->$/);
											rev = rev[1];
											diff = diff.replace(/<!-- rev \d+ -->$/m, '');

											resolve({diff: diff, rev: rev});
										}
										else
										{
											reject(response);
										}
									},
									failure: function (response)
									{
										reject(response);
									}
								}
							);
						}
					);
				}
			);

			return promise;
		},

		/**
		 * Сохраняет дифф на хабе для текущей ревизии.
		 * @param {Number} rev Номер текущей ревизии.
		 * @return {Promise}
		 */
		saveDiff: function (rev)
		{
			var me = this,
				manager = me.manager,
				art = me.getArt(),
				csrf = FBEditor.csrf.Csrf,
				saveUrl,
				revision,
				promise,
				diff;

			revision = manager.getRevision();

			// получаем собственнный дифф
			diff = revision.getDiff();

			//console.log('diff', rev, revision, diff);

			if (!diff)
			{
				// если нет изменений в тексте, то просто не отправляем на хаб ничего
				return Promise.resolve(false);
			}

			promise = new Promise(
				function (resolve, reject)
				{
					me.getSaveUrl({rev: rev}).then(
						function (url)
						{
							saveUrl = url;

							return csrf.getToken();
						}
					).then(
						function (token)
						{
							Ext.log({level: 'info', msg: 'Сохранение дифф тела книги ' + saveUrl});

							Ext.Ajax.request(
								{
									url: saveUrl,
									params: {
										action: 'update_hub_on_fb3_body',
										art: art,
										rev: rev,
										body_diff: diff,
										csrf: token
									},
									success: function (response)
									{
										var diff,
											rev;

										if (response && response.responseText)
										{
											diff = response.responseText;
											rev = diff.match(/rev (\d+) -->$/);

											if (rev)
											{
												rev = rev[1];
												resolve({diff: diff, rev: rev});
											}
											else
											{
												reject(response);
											}
										}
										else
										{
											reject(response);
										}
									},
									failure: function (response)
									{
										reject(response);
									}
								}
							);
						}
					);
				}
			);

			return promise;
		}
	}
);