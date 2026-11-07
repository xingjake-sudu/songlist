<script lang="ts">
  import { enhance } from '$app/forms';
  import { isPending, pendingEnhance } from '$lib/pending.svelte';
  import { getPasteInputEcho, type AdminActionForm } from '$lib/admin/result';
  import Select from '$lib/components/ui/Select.svelte';
  import { songLanguageItems, songStatusItems } from '$lib/select-options';
  import { Tabs } from 'bits-ui';

  let {
    active = $bindable('manual'),
    form
  }: {
    active?: string;
    form?: AdminActionForm;
  } = $props();

  const pasteInputEcho = $derived(getPasteInputEcho(form));
</script>

<div class="panel-card min-w-0">
  <h2 class="text-lg font-semibold text-[var(--color-text)]">添加歌曲</h2>

  <Tabs.Root bind:value={active} class="mt-5 space-y-4">
    <Tabs.List class="admin-tabs-list inline-flex">
      <Tabs.Trigger value="manual" class="admin-tab-trigger">手动填写</Tabs.Trigger>
      <Tabs.Trigger value="paste" class="admin-tab-trigger">批量粘贴</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="manual">
      <form method="POST" action="?/saveSong" class="space-y-4" use:enhance={pendingEnhance('save-new')}>
        <label class="field-label">
          <span>歌曲名</span>
          <input name="title" class="form-field" placeholder="例如：祝福" />
        </label>

        <label class="field-label">
          <span>原唱</span>
          <input name="artist" class="form-field" placeholder="例如：YOASOBI" />
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="field-label">
            <span>语言</span>
            <Select name="language" required value="其他" items={songLanguageItems} />
          </label>

          <label class="field-label">
            <span>状态</span>
            <Select name="status" value="ready" items={songStatusItems} />
          </label>
        </div>

        <label class="field-label">
          <span>标签（逗号分隔）</span>
          <input name="tagsInput" class="form-field" placeholder="例如：高能, 日语, 动画" />
        </label>

        <label
          class="flex items-center gap-3 rounded-[14px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)]"
        >
          <input
            name="isPublic"
            type="checkbox"
            class="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
            checked
          />
          <span>公开展示到前台歌单</span>
        </label>

        <button
          type="submit"
          class="button button-primary button-full"
          disabled={isPending('save-new')}
          data-pending={isPending('save-new') || undefined}
        >
          保存歌曲
        </button>
      </form>
    </Tabs.Content>

    <Tabs.Content value="paste" class="space-y-4">
      <div
        class="rounded-[16px] border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3 text-xs leading-6 text-[var(--color-text-secondary)]"
      >
        <p class="font-medium text-[var(--color-text)]">一行一首，歌名和原唱用分隔符隔开</p>
        <p>支持制表符、<code class="font-mono"> - </code>、<code class="font-mono">|</code>。分隔符前后要有空格，歌名里带「-」也不会被拆错。</p>
        <p class="mt-1 font-mono text-[var(--color-text)]">祝福 - YOASOBI<br />群青 | YOASOBI</p>
        <p class="mt-1">没写原唱的会记为「未知」，之后能在列表里改。</p>
      </div>

      <form method="POST" action="?/previewPaste" class="space-y-3" use:enhance={pendingEnhance('preview-paste')}>
        <textarea
          name="pasteInput"
          rows="10"
          class="form-field font-mono text-sm"
          placeholder="祝福 - YOASOBI&#10;群青 - YOASOBI&#10;夜に駆ける - YOASOBI"
        >{pasteInputEcho}</textarea>

        <button
          type="submit"
          class="button button-secondary button-full"
          disabled={isPending('preview-paste')}
          data-pending={isPending('preview-paste') || undefined}
        >
          解析并预览
        </button>
      </form>
    </Tabs.Content>
  </Tabs.Root>
</div>
