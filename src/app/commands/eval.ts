import { Command, CommandGroup } from '@classes/client/Command.js';
import { developerIds } from '@common/constants.js';
import { emb, pastecord } from '@utils';
import { ContextMenuCommandBuilder, codeBlock } from 'discord.js';
import { inspect } from 'util';

// Edit at your own risk

export default new Command.MessageContext({
  builder: new ContextMenuCommandBuilder(),
  metadata: {
    name: 'Eval',
    description: 'Developer command. Evaluates JS code and outputs the result.',
    cooldown: 24 * 60 * 60,
    group: CommandGroup.general,
    guildOnly: false,
    developer: true
  },
  execute: async function (interaction, client) {
    if (!developerIds.includes(interaction.user.id)) {
      await interaction.reply({ embeds: [emb('error', `You're not allowed to use this command.`)], ephemeral: true });
      return true;
    }

    await interaction.deferReply({ fetchReply: true, ephemeral: true });

    const _msg = await interaction.channel!.messages.fetch(interaction.targetId);

    const _content = _msg.content.length > 0 ? _msg.content : "'No code was provided.'";

    const _code = _content.startsWith('```js') ? _content.slice(5, -3) : _content;

    let _output: any;

    try {
      _output = await eval(`(async () => { ${_code} })()`);
    } catch (e) {
      _output = e;
    } finally {
      if (typeof _output !== 'string') {
        _output = inspect(_output);
      }

      const out = _output as string;

      let needsPaste = false;
      let result: string;

      if (out.length > 4000) {
        result = codeBlock('js', out.slice(0, 4000));
        needsPaste = true;
      } else result = codeBlock('js', out);

      const resultEmbed = emb('info', result);

      if (needsPaste) {
        const paste = await pastecord(out);

        resultEmbed.addFields({
          name: '\u200b',
          value: `[Full Output](${paste})`
        });
      }

      await interaction.editReply({ embeds: [resultEmbed] });
      return false;
    }
  }
});
