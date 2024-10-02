---
title: "Fixing Gem Install Errors on M3 Mac with Ruby 2.7"
featuredImage: "../images/fix-gem-install-issues-julien-pier-belanger-SoFNVdiJQgc-unsplash.jpg"
description: "A guide to resolving common gem installation errors such as `pg`, `nokogiri`, and `msgpack` when setting up a Rails project on an M3 Mac with Ruby 2.7.8, including solutions and troubleshooting steps."
date: "2025-02-01"
category: "rails"
related:
  - "Homebrew Postgresql Service not Starting Resolved"
  - "Dockerize a Rails Application for Development"
  - "Old Ruby and New Mac"
---

When setting up a legacy Rails 6.1 project on an M3 Mac using Ruby 2.7.x, I encountered errors during `bundle install` for several gems like `pg`, `nokogiri`, and `msgpack`. This can happen due to the native extensions certain gems rely on, which aren't always fully compatible with newer Mac ARM architecture. While [Ruby 2.7.x is no longer officially supported](https://endoflife.date/ruby), it's still common to work with legacy systems that require older versions during maintenance or upgrades.

In this post, I’ll walk through each issue, including the error message you might see, an explanation of the issue, and the solution to fix it.

##  Nokogiri

Here are snippets of the error I encountered during `bundle install` for the [nokogiri](https://rubygems.org/gems/nokogiri) gem:

```
Gem::Ext::BuildError: ERROR: Failed to build gem native extension.

Building nokogiri using packaged libraries.
checking for iconv... yes

Building Nokogiri with a packaged version of libxml2-2.11.7.

Running git apply with
/path/to/gems/nokogiri-1.15.6/patches/libxml2/0001-Remove-script-macro-support.patch...

*** extconf.rb failed ***

Could not create Makefile due to some reason,
probably lack of necessary libraries and/or headers.

/path/to/gems/mini_portile2-2.8.7/lib/mini_portile2/mini_portile.rb:589:in
`chdir': no implicit conversion of nil into String (TypeError)

To see why this extension failed to compile, please check the mkmf.log which can be found here:
/path/to/gems/2.7.0/extensions/arm64-darwin-23/2.7.0/nokogiri-1.15.6/mkmf.log

extconf failed, exit code 1

An error occurred while installing nokogiri (1.15.6), and Bundler cannot continue.
```

This error usually occurs when `nokogiri` fails to compile due to missing libraries or misconfigured compilation flags. On a Mac, it often involves issues with `libxml2` or `iconv`, which `nokogiri` depends on.

Inspecting the `nokogiri-1.15.6/mkmf.log` file mentioned in the error message revealed a compilation error with `iconv`:

```
try_link_iconv: checking for iconv... -------------------- yes

"clang -o conftest
  -I/path/to/ruby/2.7.8/include/ruby-2.7.0/arm64-darwin23 -I/path/to/ruby/2.7.8/include/ruby-2.7.0/ruby/backward -I/path/to/ruby/2.7.8/include/ruby-2.7.0 -I. -D_XOPEN_SOURCE -D_DARWIN_C_SOURCE -D_DARWIN_UNLIMITED_SELECT -D_REENTRANT   -g -O2 -fno-common -pipe -std=c99 -Wno-declaration-after-statement -O2 -g -Winline -Wmissing-noreturn -Wshorten-64-to-32 -Wno-unknown-warning-option conftest.c  -L. -L/path/to/ruby/2.7.8/lib -L. -fstack-protector-strong  -m64   -lruby.2.7   "

Undefined symbols for architecture arm64:
  "_iconv", referenced from:
      _main in conftest-ea30a6.o
  "_iconv_open", referenced from:
      _main in conftest-ea30a6.o
ld: symbol(s) not found for architecture arm64
clang: error: linker command failed with exit code 1 (use -v to see invocation)
checked program was:
/* begin */
 1: #include "ruby.h"
 2:
 3: #include <stdlib.h>
 4: #include <iconv.h>
 5: int main(void)
 6: {
 7:     iconv_t cd = iconv_open("", "");
 8:     iconv(cd, NULL, NULL, NULL, NULL);
 9:     return EXIT_SUCCESS;
10: }
/* end */
```

The error occurs when trying to link against the `iconv` library. The linker is failing because it cannot find the `iconv` symbols (`_iconv` and `_iconv_open`) for the arm64 architecture.

**Solution:**

Newer Macs actually come with a compatible version of `iconv` but the default nokogiri install script isn't using it. You can configure bundler to use the system libraries when installing nokogiri as follows:

```bash
bundle config build.nokogiri --use-system-libraries
```

This tells `nokogiri` to use the pre-installed libraries on your system.

After running this, try running `bundle install` again, and the `nokogiri` gem should compile successfully.

For more discussion on this topic, see [Why does installing Nokogiri on Mac OS fail with libiconv is missing?](https://stackoverflow.com/questions/5528839/why-does-installing-nokogiri-on-mac-os-fail-with-libiconv-is-missing). Also this question [_libiconv or _iconv undefined symbol on Mac OSX](https://stackoverflow.com/questions/57734434/libiconv-or-iconv-undefined-symbol-on-mac-osx) provides further context.

## PostgreSQL pg

Here are snippets of the error I encountered during `bundle install` for the [pg](https://rubygems.org/gems/pg) gem:

```
Gem::Ext::BuildError: ERROR: Failed to build gem native extension.

current directory: /path/to/gems/2.7.0/gems/pg-1.2.3/ext

checking for pg_config... no

No pg_config... trying anyway.
If building fails, please try again with
 --with-pg-config=/path/to/pg_config

checking for libpq-fe.h... no
Can't find the 'libpq-fe.h header

*** extconf.rb failed ***

Could not create Makefile due to some reason,
probably lack of necessary libraries and/or headers.
```

This error occurs when the `pg` gem can’t find PostgreSQL’s development libraries (`libpq`). This often happens when PostgreSQL isn’t installed or its binaries aren’t properly set up in your `PATH`.

The `pg` gem requires the PostgreSQL client libraries to be available during installation, and it uses `pg_config` to find the necessary files. Without this configuration, the gem cannot be built.

**Solution:**

Make sure PostgreSQL is installed via Homebrew, and then ensure the `pg_config` binary is available in your `PATH`:

```bash
# Or whatever version your project depends on
brew install postgresql@14
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
```

After running this, try running `bundle install` again, and the `pg` gem should compile successfully.

## Msgpack and Bootsnap

Here are snippets of the error I encountered during `bundle install` for the [msgpack](https://rubygems.org/gems/msgpack) gem:

```
Gem::Ext::BuildError: ERROR: Failed to build gem native extension.

    current directory: /Users/myuser/.rbenv/versions/2.7.8/lib/ruby/gems/2.7.0/gems/msgpack-1.3.1/ext/msgpack
/Users/myuser/.rbenv/versions/2.7.8/bin/ruby -I /Users/myuser/.rbenv/versions/2.7.8/lib/ruby/2.7.0 -r ./siteconf20240802-87419-1amtg6u.rb extconf.rb
checking for ruby/st.h... yes
checking for st.h... yes
checking for rb_str_replace() in ruby.h... yes
checking for rb_intern_str() in ruby.h... yes
checking for rb_sym2str() in ruby.h... yes
checking for rb_str_intern() in ruby.h... yes
checking for rb_block_lambda() in ruby.h... yes
checking for rb_hash_dup() in ruby.h... yes
checking for rb_hash_clear() in ruby.h... yes
creating Makefile

current directory: /Users/myuser/.rbenv/versions/2.7.8/lib/ruby/gems/2.7.0/gems/msgpack-1.3.1/ext/msgpack
make "DESTDIR=" clean

current directory: /Users/myuser/.rbenv/versions/2.7.8/lib/ruby/gems/2.7.0/gems/msgpack-1.3.1/ext/msgpack
make "DESTDIR="
compiling buffer.c
compiling buffer_class.c

buffer_class.c:261:17: error: incompatible function pointer types passing 'VALUE (VALUE)' (aka 'unsigned long (unsigned long)') to parameter of type 'VALUE (*)(VALUE, VALUE)' (aka 'unsigned long (*)(unsigned long, unsigned long)')
[-Wincompatible-function-pointer-types]
                read_until_eof_error, (VALUE)(void*) args,
                ^~~~~~~~~~~~~~~~~~~~
/path/to/ruby/2.7.8/include/ruby-2.7.0/ruby/ruby.h:1990:47:
note: passing argument to parameter here
VALUE rb_rescue2(VALUE(*)(VALUE),VALUE,VALUE(*)(VALUE,VALUE),VALUE,...);
                                              ^
1 error generated.
make: *** [buffer_class.o] Error 1

make failed, exit code 2

An error occurred while installing msgpack (1.3.1), and Bundler cannot continue.

In Gemfile:
  bootsnap was resolved to 1.4.5, which depends on
    msgpack
```

<aside class="markdown-aside">
The msgpack gem is a dependency of <a class="markdown-link" href="https://github.com/shopify/bootsnap">bootsnap</a>, which is often included in Rails applications to improve boot times by optimizing the loading of code.
</aside>

This error is caused by stricter function pointer checks when building C extensions on the ARM architecture of the M3 Mac.

**Solution:**

To bypass this issue, you can add a compiler flag that ignores these errors. Run the following commands to configure Bundler to use this flag when building the affected gems:

```bash
bundle config set --global build.msgpack "--with-cflags=-Wno-error=incompatible-function-pointer-types"
bundle config set --global build.bootsnap "--with-cflags=-Wno-error=incompatible-function-pointer-types"
```

This will suppress the function pointer type warnings and allow the gems to install correctly.

This discussion on a different GitHub project has more information on the [incompatible function pointer type error on an M3 Mac](https://github.com/grpc/grpc/issues/35148).

## Conclusion

When encountering gem installation errors on an M3 Mac using Ruby 2.7.x, it’s essential to inspect the console output and installation log files to understand the root cause. Whether it’s missing libraries, incorrect configuration, or ARM-specific compilation issues, using the correct flags and ensuring your environment is properly set up can help resolve the errors.
